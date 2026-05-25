---
title: CSAPP Lab 5 - Cache 实验解析
date: 2026-02-12 16:54:22
tags: [CSAPP, Cache, Systems Programming]
categories: [CSAPP]
---

## 任务A

>编写一个高速缓存模拟程序。在这部分任务中，你将在csim.c文件中编写一个高速缓存仿真程序。这个程序使用valgrind的内存跟踪记录作为输入，模拟高速缓存的命中/未命中行为，然后输出总的命中次数，未命中次数和缓存块的替换次数。

首先做一些准备工作，定义存储数据的结构体
```c
//首先创建结构体用于存储数据
typedef struct
{// 缓存行
    bool valid;//有效位
    unsigned tag;//标记
    int timestamp;//最后一次访问时间
}CacheLine;

typedef struct
{// 缓存组
    CacheLine *lines;//组中的所有行
    unsigned Enum;  //组中存放有效数据行数
}CacheGroup;

typedef struct
{//缓存
    CacheGroup *groups;//缓存的所有组
    unsigned S, s;//组数
    unsigned E;//行数
    unsigned B, b;//块大小
    unsigned time;//时间
}Cache;

Cache Ca;//全局缓存变量
```
根据高速缓存的原理，对结构体中的数据进行合适的初始化操作。这一部分建议回顾课件中的相关内容，直到自己可以完全不参考任何资料能独立写出来为止。

![](/images/cache.png)

下面是一系列的预处理，根据$S = 2^s$ 和 $B = 2^b$, 通过移位运算设置S和B的值，进行动态内存分配给每个行和组分配内存，初始化行计数器并将有效位置为0。

```c
void initCache(int s, int E, int b)
{//初始化缓存
    Ca.s = s, Ca.E = E, Ca.b = b;
    Ca.S = 1 << s, Ca.B = 1 << b;//S = 2^s, B = 2^b
    Ca.groups = (CacheGroup *)malloc(sizeof(CacheGroup) * Ca.S);//为每个组分配内存
    for (unsigned i = 0; i < Ca.S; ++i)
    {
        Ca.groups[i].Enum = 0;//初始化计数器
        Ca.groups[i].lines = (CacheLine *)malloc(sizeof(CacheLine) * E);//为每行分配内存
        for (unsigned j = 0; j < E; ++j)
        {
            Ca.groups[i].lines[j].valid = 0;//有效位置0
        }
    }
}
```

接下来对行遍历，模拟组中是否有行的标记tag和有效位valid都匹配，如果匹配则返回相应的行。

```c
CacheLine *findLine(CacheGroup s, unsigned tag)
{//根据tag查找行
    for (unsigned i = 0; i < s.Enum; ++i)//遍历行
    {
        if (s.lines[i].valid && s.lines[i].tag == tag)
        {
            s.lines[i].timestamp = Ca.time;//更新时间戳
            return &s.lines[i];
        }
    }
    return NULL;//未找到相应行
}
```

在匹配到行之后，根据高速缓存的规则，模拟更新行有效位和tag的操作，或在组中添加新行的操作。

```c
void setLine(CacheLine *l, unsigned tag)
{//设置行的有效位和tag
    l->valid = 1;
    l->tag = tag;
    l->timestamp = Ca.time;
}
void newBlock(CacheGroup *s, unsigned tag)
{//在组中添加新行（组未满）
    setLine(&s->lines[s->Enum], tag);
    ++s->Enum;
}
```

通过遍历行查找最小时间戳，实现LRU策略。

```c
CacheLine *LRU(CacheGroup s)
{//执行最近最小使用策略
    unsigned id = 0;
    for (unsigned i = 1; i < Ca.E; ++i)
        if (s.lines[i].timestamp < s.lines[id].timestamp)
            id = i;//遍历行，找到最小时间戳
    return &s.lines[id];
}
```

通过`-h`命令查看`csim-ref`中`help`的提示语，在`csim`中设置同样的输出。

```c
bool verbose;
void printHelp(char *file) 
{
    printf("Usage: %s [-hv] -s <s> -E <E> -b <b> -t <tracefile>\n", file);
    printf("Options:\n");
    printf("  -h          Print this help message.\n");
    printf("  -v          Optional verbose flag.\n");
    printf("  -s <num>    Number of set index bits.\n");
    printf("  -E <num>    Number of lines per set.\n");
    printf("  -b <num>    Number of block offset bits.\n");
    printf("  -t <file>   Trace file.\n");
}
```

下一步是模拟高速缓存的核心步骤，首先通过移位运算，根据块偏移位数`Ca.s`和组索引位数`Ca.b`，把传入的地址拆分成`tag`和`set`两部分。然后调用`findline`查找相应的行，如果找到了对应行并且启用了v模式，就输出`hit`并且计数，反之未命中计数。如果缓存组中的有效行数`s->Enum` 等于每组的行数`Ca.E`（即组已满），执行 LRU 替换策略，替换计数增加，并且调用LRU函数找到最久未使用的行，调用`setline`更新该行的标签和时间戳，如果缓存组未满，调用`newBlock`函数在组中添加新行。

```c
void cacheaccess(unsigned addr)
{
    ++Ca.time;
    unsigned tag = addr >> (Ca.b + Ca.s), set = (addr >> Ca.b) & (Ca.S - 1);//解析地址
    CacheLine *l = findLine(Ca.groups[set], tag);//查找缓存行
    if (l)
    {
        if (verbose) printf(" hit");
        ++hit;//匹配到有效行则为命中
        return;
    }
    if (verbose) printf(" miss");
    ++miss;//未匹配到有效行则为未命中
    CacheGroup *s = &Ca.groups[set];
    if (s->Enum == Ca.E)
    {//组已满，执行LRU策略，进行行替换
        if (verbose) printf(" eviction");
        ++evi;
        CacheLine *ev = LRU(*s);
        setLine(ev, tag);
    }
    else
    newBlock(s, tag);
}
```

实验文档中提示操作有四种类型，分别为I、L、S和M：
* I表示进行了一次指令加载，不涉及数据的缓存，所以在程序中可以忽略。
* L表示进行了一次数据加载。
* S表示进行了一次数据存储，所以L和S都要进行一次数据访存。
* M表示进行了数据修改（先读内存，后写内存），也就意味之M需要两次数据访存。
分别实现对应的功能

```c
void readTrace(FILE *fp)
{
    char op;
    unsigned addr, size;
    while (fscanf(fp, " %c %x,%u", &op, &addr, &size) > 0)
    {
        if (op == 'I') continue;//指令加载不涉及数据，直接跳过
        if (verbose) printf(" %c %x,%u", op, addr, size);
        if (op == 'L') cacheaccess(addr);
        else if (op == 'S') cacheaccess(addr);
        else if (op == 'M') cacheaccess(addr), cacheaccess(addr);//修改操作需要两次访问
        if (verbose) printf("\n");
    }
    fclose(fp);
}
```

最后完成主函数，通过switch语句，根据传入指令的类型，分别执行相应的访存计算或提示输出，最终实现计算每一次高速缓存的命中、未命中和替换次数。

```c
int main(int argc, char **argv)
{
    hit = miss = evi = 0;
    int s = -1, E = -1, b = -1;
    char op;
    FILE *fp = NULL;
    while ((op = getopt(argc, argv, "hvs:E:b:t:")) != -1)
    {
        switch (op)
        {
            case 'h':
                printHelp(argv[0]);
                return 0;
            case 'v':
                verbose = 1;
                break;
            case 's':
                s = atoi(optarg);
                break;
            case 'E':
                E = atoi(optarg);
                break;
            case 'b':
                b = atoi(optarg);
                break;
            case 't':
                fp = fopen(optarg, "r");
                if (fp == NULL)
                {
                    printf("%s: No such file or directory\n", optarg);
                    return 0;
                }
                break;
            default:
                printHelp(argv[0]);
                return 0;
        }
    }
    if (!~s || !~E || !~b || !fp)
    {
        printf("Missing required command line argument\n");
        printHelp(argv[0]);
        return 0;
    }
    initCache(s, E, b);
    readTrace(fp);
    printSummary(hit, miss, evi);
    return 0;
}
```

## 任务B

>优化矩阵转置运算程序。在trans.c中编写一个矩阵转置函数，尽可能的减少程序对高速缓存访问的未命中次数。

这个任务需要优化矩阵转置的操作，用最直接的方式转置矩阵代码实现非常简单，但是高速缓存的未命中次数过多，这里需要通过“分块”的方法减少矩阵转置中的未命中次数。通过学习原实验给出的参考文档，解决冲突未命中的关键在于两点，一方面要对大型的矩阵分块成小矩阵处理，另一方面要单独处理对角线上的元素，减少非必要的转置。

### 32*32

首先，测试一下完全不适用任何优化的情况下，未命中的次数为1183次。下面分析这个未命中次数在理论上是如何产生的。$s = 5, E = 1, b = 5 $的缓存有32组，每组一行，每行存8个int型数据。A中的元素是按行读的，每行有$32/8=4$次未命中，而B中的元素是按列读的，每一次都会产生未命中。由此，算出总不命中次数为 $4 × 32 + 32 × 32 = 1152$。这个数据比实际值小是为什么呢？因为A和B矩阵是同时被访问的，因此B矩阵的操作会影响 A 矩阵的缓存。这种影响只会发生在转置对角线元素的时候，只有这个时候 A和B会使用同一个缓存，对B的写会把A当前的缓存驱逐出去，因此下一次读A上同一个块的时候，会触发一次不命中。只有整个矩阵最后一个元素在写完以后不需要再读这个块，因此总共多了31 次不命中。
根据刚才的分析，主要的不命中都是B矩阵导致的，所以需要解决B矩阵未命中的问题。因为一行高速缓存中可以存8个int类型变量，所以可以把A和B都分成$4×4$个大小为$8×8$的分块矩阵，每处理完一个块之后再处理下一个块。

```c
void transpose_32x32(int M，int N，int A[N][M]，int B[M][N]){
    for (int ii=0;ii<32;ii+=8)
        for (int jj = 0; jj く 32; jj += 8)
            for (int i=ii;i<ii+8;++i)
                for (int j = jj; j くjj + 8; ++j)
                    B[j][i]= A[i][j];
}
```

根据以上的分析可以写出这样的代码，但这样写很显然是有问题的。如果按照预期，对于A中每一个操作块，只有每一行的第一个元素会不命中，所以8次不命中；对于B中每一个操作块，只有每一列的第一个元素会不命中，所以也为 8 次不命中。总共miss次数为：$8×16×2 = 256$。但是实际测试中，未命中的次数是343。原因就在于A和B对角线上的块在缓存中对应的位置是相同的，而它们在转置过程中位置不变，所以复制过程中会发生相互冲突。对角线上的一个元素会导致三次驱逐，比未使用分块策略时的驱逐还要严重。为此，解决的策略是使用8个局部变量存储A的一整行，然后写入B的对应位置。这样就可以对每一个元素减少两次驱逐。最终得到的代码如下：

```c
void transpose_32x32(int M, int N, int A[N][M], int B[M][N]) {
    for (int ii = 0; ii < 32; ii += 8)
        for (int jj = 0; jj < 32; jj += 8)
            for (int i = ii; i < ii + 8; ++i) 
            {
                int a0 = A[i][jj];
                int a1 = A[i][jj + 1];
                int a2 = A[i][jj + 2];
                int a3 = A[i][jj + 3];
                int a4 = A[i][jj + 4];
                int a5 = A[i][jj + 5];
                int a6 = A[i][jj + 6];
                int a7 = A[i][jj + 7];
                B[jj][i] = a0;
                B[jj + 1][i] = a1;
                B[jj + 2][i] = a2;
                B[jj + 3][i] = a3;
                B[jj + 4][i] = a4;
                B[jj + 5][i] = a5;
                B[jj + 6][i] = a6;
                B[jj + 7][i] = a7;
            }
}
```

### 64*64

这种情况下每4行就会沾满缓存，所以需要把$8×8$的分块调整为$4×4$的分块，这样的未命中次数是1891，还没有达到满分的要求，需要继续调整。在$8×8$的基础上分成$4×4×4$的小块。首先将A的左上和右上一次性复制给B，此时B的前4行就在缓存中了，接下来考虑利用这个缓存。然后用本地变量把B的右上角存储下来。现在现在缓存中还是存着B中上两块的内容，所以将A的左下复制给B的右上。利用上述存储B的右上角的本地变量，把A的右上复制给B的左下，这样就实现了转置，且消除了同一行中的冲突。最后把A的右下复制给B的右下。

```c
void transpose_64x64(int M, int N, int A[N][M], int B[M][N]) 
{
    int a0, a1, a2, a3, a4, a5, a6, a7;
    for (int ii = 0; ii < N; ii += 8)
        for (int jj = 0; jj < M; jj += 8) 
        {
            for (int i = ii; i < ii + 4; ++i) 
            {
                a0 = A[i][jj + 0];
                a1 = A[i][jj + 1];
                a2 = A[i][jj + 2];
                a3 = A[i][jj + 3];
                a4 = A[i][jj + 4];
                a5 = A[i][jj + 5];
                a6 = A[i][jj + 6];
                a7 = A[i][jj + 7];
                B[jj + 0][i] = a0;
                B[jj + 1][i] = a1;
                B[jj + 2][i] = a2;
                B[jj + 3][i] = a3;
                B[jj + 0][i + 4] = a4;
                B[jj + 1][i + 4] = a5;
                B[jj + 2][i + 4] = a6;
                B[jj + 3][i + 4] = a7;
            }
            for (int j = jj; j < jj + 4; ++j) 
            {
                a0 = B[j][ii + 4];
                a1 = B[j][ii + 5];
                a2 = B[j][ii + 6];
                a3 = B[j][ii + 7];
                B[j][ii + 4] = A[ii + 4][j];
                B[j][ii + 5] = A[ii + 5][j];
                B[j][ii + 6] = A[ii + 6][j];
                B[j][ii + 7] = A[ii + 7][j];
                B[j + 4][ii + 0] = a0;
                B[j + 4][ii + 1] = a1;
                B[j + 4][ii + 2] = a2;
                B[j + 4][ii + 3] = a3;
            }
            for (int i = ii + 4; i < ii + 8; ++i) 
            {
                a0 = A[i][jj + 4];
                a1 = A[i][jj + 5];
                a2 = A[i][jj + 6];
                a3 = A[i][jj + 7];
                B[jj + 4][i] = a0;
                B[jj + 5][i] = a1;
                B[jj + 6][i] = a2;
                B[jj + 7][i] = a3;
            }
        }
}
```

### 61*67

因为这个矩阵不是方阵，直接分块难免会产生不必要的冲突未命中，因此，需要在原来$8×8$分块的基础上，先用原来的方法处理主体部分，然后通过边界条件判断处理一些边角的细节。因为这个任务给定的条件相对比较宽松，所以不需要再进行额外的特殊处理就能通过。

```c
void transpose_61x67(int M, int N, int A[N][M], int B[M][N]) 
{
    int a0, a1, a2, a3, a4, a5, a6, a7;
    for (int ii = 0; ii < N; ii += 8)
        for (int jj = 0; jj < M; jj += 8)
            for (int i = ii; i < ii + 8 && i < N; ++i) 
            {
                if (jj + 0 < M) a0 = A[i][jj];
                if (jj + 1 < M) a1 = A[i][jj + 1];
                if (jj + 2 < M) a2 = A[i][jj + 2];
                if (jj + 3 < M) a3 = A[i][jj + 3];
                if (jj + 4 < M) a4 = A[i][jj + 4];
                if (jj + 5 < M) a5 = A[i][jj + 5];
                if (jj + 6 < M) a6 = A[i][jj + 6];
                if (jj + 7 < M) a7 = A[i][jj + 7];
                if (jj + 0 < M) B[jj][i] = a0;
                if (jj + 1 < M) B[jj + 1][i] = a1;
                if (jj + 2 < M) B[jj + 2][i] = a2;
                if (jj + 3 < M) B[jj + 3][i] = a3;
                if (jj + 4 < M) B[jj + 4][i] = a4;
                if (jj + 5 < M) B[jj + 5][i] = a5;
                if (jj + 6 < M) B[jj + 6][i] = a6;
                if (jj + 7 < M) B[jj + 7][i] = a7;
            }
}
```

### 总结

Cache Lab需要对高速缓存的机制做到非常熟悉即可完成任务A，任务B的关键是能想明白矩阵分块之后是如何运算的以及如何处理边界条件。

*免责声明*：
本文的解析参考了[TJU Course Sharing](https://cs.tjuse.com/zh-CN/)中的部分内容，并借助AI工具进行整理。
解析仅供参考，不得抄袭！