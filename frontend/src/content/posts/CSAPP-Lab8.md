---
title: CSAPP Lab 8 - Proxy 实验解析
date: 2026-02-12 20:05:08
tags: [CSAPP, Proxy, Socket, Systems Programming]
categories: [CSAPP]
---

## 实验内容和任务
**第一部分**：实现一个顺序的代理服务器
实现一个基础的顺序代理服务，用于处理 HTTP/1.0 的 GET 请求。其他类型的请求，如 POST，是选做的。
启动时，你的代理应该监听在命令行指定的端口上接收传入连接。一旦建立了连接，代理应该从客户端读取整个请求并解析请求。它应该确定客户端是否发送了有效的 HTTP 请求；如果是，则可以建立自己的连接到适当的 Web 服务器，然后请求客户端指定的对象。最后，代理应该读取服务器的响应并将其转发给客户端。
**第二部分**：处理多个并发请求
当你实现了个工作正常的顺序代理后，你应该优化它以实现同时处理多个请求的能力。
实现并发服务器的最简单方式是针对每个新连接请求生成一个新线程来处理。也可以采用其他设计，例如教材中第12.5.5节中描述的预程化服务器。
**第三部分**：缓存Web对象
在实验的最后部分，你将为你所实现的代理添加一个缓存，用于将最近使用的 Web 对象存储在内存中。HTTP 实际上定义了一个相当复杂的模型，通过该模型，Web 服务器可以指示它们提供的对象应如何被缓存，客户端可以指定代理应如何代表它们使用缓存。但是，你的代理可以采用更加简单的方法。
当你的代理从服务器接收到一个 Web 对象时，它应该在将对象传输给客户端的同时将其缓存到内存中。如果另一个客户端从相同的服务器请求相同的对象，您的代理不需要重新连接到服务器；它可以简单地重新发送存的对象。显然，如果您的代理缓存每一个被请求的对象，那么它将需要无限量的内存。
此外，由于某些 Web 对象比其他对象大，可能会出现一个巨大的对象占用整个缓存的情况，导致其他对象根本无法缓存。为了避免这些问题，您的代理应该有一个最大缓存容量和一个最大缓存对象大小

## 实验结果

### 第一部分

首先磨刀不误砍柴工，根据实验手册的提示，先研究`tiny web`的源码和`csapp.c` 以及`csapp.h`中相关的代码。然后分析一下为了实现基本的需要，需要哪些功能，主函数：用于处理客户端连接请求，URL处理函数：用于切分URL，解析所需要的信息，客户端读取函数：从客户端读取请求并生成新的请求，套接字处理函数：用于处于成功连接的套接字接口。
对于主函数而言，简单来说使用一个while循环，不停地等待客户端连接，一旦连接成功，就调用doit函数进行处理，具体的实现细节可以类比于tinyweb来改写。
```c
int main(int argc, char **argv) 
{
    int listenfd, connfd;
    char hostname[MAXLINE], port[MAXLINE];
    socklen_t clientlen;
    struct sockaddr_storage clientaddr;
    pthread_t tid;
 
    /* 检查命令行参数 */
    if (argc != 2) {
        fprintf(stderr, "usage: %s <port>\n", argv[0]);
        exit(1);
    }
 
    listenfd = Open_listenfd(argv[1]);
    while (1) {
        clientlen = sizeof(clientaddr);
        // 等待并接受客户端连接请求
        connfd = Accept(listenfd, (SA *)&clientaddr, &clientlen); //line:netp:tiny:accept
        Getnameinfo((SA *) &clientaddr, clientlen, hostname, MAXLINE, port, MAXLINE, 0);
        printf("Accepted connection from (%s, %s)\n", hostname, port);
        // 将连接描述符插入到有界缓冲区，交给工作线程处理
        sbuf_insert(&sbuf, connfd);
    }
}
```

对于一个传入的URL字符串，我们首先忽略掉``http://''这种协议标识，可以通过查找//字符串来实现。然后，我们找到第一个/字符，在这个字符后面的就是路径。如果找不到这个字符，我们就认为访问的是根路径。随后我们将这个字符设置为\0，方便之后
端口的读取。接下来，我们通过`:`字符来定位端口，`:`后面的就是端口，如果找不到:那么就认为端口是80，然后我们将这个字符设置为\0。最后，剩下的字符串就是`host`。

```c
void parseUrl(char *s, URL *url) {
    //读取https://或http://后面的信息
    char *ptr = strstr(s, "//");
    if (ptr != NULL) s = ptr + 2;
 
    strcpy(url->path, "/"); // 默认路径为 "/"，防止 URL 中没有路径的情况
    // 查找路径开始的位置 '/'
    ptr = strchr(s, '/');
    if (ptr != NULL) {
        strncpy(url->path, ptr, MAXLINE - 1);
        url->path[MAXLINE - 1] = '\0';
        *ptr = '\0'; // 截断字符串，方便后续提取 host 和 port
    }
    
    // 查找端口开始的位置 ':'
    ptr = strchr(s, ':');
    if (ptr != NULL) {
        strncpy(url->port, ptr + 1, MAXLINE - 1);
        url->port[MAXLINE - 1] = '\0';
        *ptr = '\0'; // 截断字符串，剩下的就是 host
    } else strcpy(url->port, "80"); // 默认端口 80
 
    strncpy(url->host, s, MAXLINE - 1);
    url->host[MAXLINE - 1] = '\0';
}
```

下面是`ReanClient`函数。这个函数会从客户端读取请求的全部内容，并生成即将发送到服务端的新请求。
设置默认的`Hosts header`为URL中的`host`。接着从接下来读取到的`headers`中，如果是Hosts那么就更新Hosts，如果是`User-Agent`、`Connection`和`Proxy-Connection`，那么就忽略（因为有要设定的专属`header`）。其余的header收集起来，稍后一并作为新请求发过去。向新请求字符串中写入我们生成的HTTP头和headers。
```c
void readClient(rio_t *rio, URL *url, char *data, char *urlstr_out) {
    char host[MAXLINE * 2];
    char line[MAXLINE];
    char other[MAXLINE];
    char method[MAXLINE], urlstr[MAXLINE], version[MAXLINE];
    
    other[0] = '\0'; 

    if (rio_readlineb(rio, line, MAXLINE) <= 0) return;
    if (sscanf(line, "%s %s %s\n", method, urlstr, version) != 3) return;
    
    // 将解析出的 urlstr 复制给输出参数
    strcpy(urlstr_out, urlstr);

    parseUrl(urlstr, url);
 
    snprintf(host, sizeof(host), "Host: %s\r\n", url->host);
    while (rio_readlineb(rio, line, MAXLINE) > 0) {
        if (strcmp(line, "\r\n") == 0) break;
        if (strncmp(line, "Host", 4) == 0) strcpy(host, line);
        if (strncmp(line, "User-Agent", 10) &&
            strncmp(line, "Connection", 10) &&
            strncmp(line, "Proxy-Connection", 16)) strncat(other, line, MAXLINE - strlen(other) - 1);
    }
    
    sprintf(data, "%s %s HTTP/1.0\r\n"
                     "%s%s"
                     "Connection: close\r\n"
                     "Proxy-Connection: close\r\n"
                     "%s\r\n", method, url->path, host, user_agent_hdr, other);
}
```

最后是`doit`函数。这个函数的功能是处理成功连接的套接字接口。首先调用`readClient`函数处理读入和生成新的请求，然后调用`open_clientfd`函数连接服务器。接着，向服务器发送新的请求。最后，将服务器发送回来的结果读入，发送到客户端套接字。

```c
void doit(int connfd) {
    rio_t rio;
    char line[MAXLINE];
    Rio_readinitb(&rio, connfd);

    URL url;
    char data[MAXLINE];
    readClient(&rio, &url, data);

    int serverfd = open_clientfd(url.host, url.port);
    if (serverfd < 0)printf("Connection failed!\n");

    rio_readinitb(&rio, serverfd);
    Rio_writen(serverfd, data, strlen(data));

    int len;
    while ((len =Rio_readlineb(&rio, line, MAXLINE)) >0)
    Rio_writen(connfd, line, len);

    Close(serverfd);
}
```
### 第二部分

第二阶段需要实现并发，也就意味着我们需要使用线程和有界缓冲区去处理问题。首先我们完善相关的定义和结构体。

```c
//有界缓冲区的结构体定义
typedef struct {
    int *buf;          /* 缓冲区数组 */         
    int n;             /* 最大槽位数 */
    int front;         /* 头指针 */
    int rear;          /* 尾指针 */
    sem_t mutex;       /* 保护对 buf 的访问 */
    sem_t slots;       /* 统计可用槽位 */
    sem_t items;       /* 统计可用项目 */
} sbuf_t;
```
然后把线程池和有界缓冲区引入到主函数里，并构造了一个生产者-消费者模型（参考课件里的例子），用于实现多线程并发。具体实现在`main`函数里加几行代码就行，不再赘述。

线程执行函数的逻辑非常直接，参考课本的示例，每次从缓冲区取出一个套接字以后就执行`doit`函数即可。
```c
void *thread(void *vargp) {
    Pthread_detach(pthread_self());
    while (1) {
        int connfd = sbuf_remove(&sbuf);
        doit(connfd);
        Close(connfd);
    }
    return NULL;
}
```

最后补齐对缓冲区操作的几个函数即可：

```c
//创建并初始化有界缓冲区
void sbuf_init(sbuf_t *sp, int n)
{
    sp->buf = Calloc(n, sizeof(int)); 
    sp->n = n;                       /* 缓冲区最多容纳 n 个项目 */
    sp->front = sp->rear = 0;        /* 当 front == rear 时缓冲区为空 */
    Sem_init(&sp->mutex, 0, 1);      /* 用于锁定的二元信号量 */
    Sem_init(&sp->slots, 0, n);      /* 初始时，buf 有 n 个空槽位 */
    Sem_init(&sp->items, 0, 0);      /* 初始时，buf 有 0 个数据项 */
}


/* 清理缓冲区  */
void sbuf_deinit(sbuf_t *sp)
{
    Free(sp->buf);
}

/* 插入到共享缓冲区的尾部 */
void sbuf_insert(sbuf_t *sp, int item)
{
    P(&sp->slots);                          /* 等待可用槽位 */
    P(&sp->mutex);                          /* 锁定缓冲区 */
    sp->buf[(++sp->rear)%(sp->n)] = item;   /* 插入项目 */
    V(&sp->mutex);                          /* 解锁缓冲区 */
    V(&sp->items);                          /* 宣布有可用项目 */
}

/* 从缓冲区 sp 移除并返回第一个项目 */
int sbuf_remove(sbuf_t *sp)
{
    int item;
    P(&sp->items);                          /* 等待可用项目 */
    P(&sp->mutex);                          /* 锁定缓冲区 */
    item = sp->buf[(++sp->front)%(sp->n)];  /* 移除项目 */
    V(&sp->mutex);                          /* 解锁缓冲区 */
    V(&sp->slots);                          /* 宣布有可用槽位 */
    return item;
}
```
### 第三部分

第三阶段是实现cache，cache的基本操作在NEMU和malloc中实现过多次了，proxy的cache的特殊点在于要把cache和读者-写者模型结合起来，并按照实验手册的要求采取LRU和读者优先。

```C
void init_cache() {
    timestamp = 0;
    readcnt = 0;
    cache.using_cache_num = 0;
    Sem_init(&mutex, 0, 1);
    Sem_init(&w, 0, 1);
}

int query_cache(rio_t* rio_p, string url) {
    // 使用全局变量 readcnt，需要加锁
    P(&mutex);
    readcnt++;
    // 第一个读者需要加锁，保证不会有写者同时访问，同时允许其他读者访问
    if (readcnt == 1) {
        P(&w);
    }
    V(&mutex);

    // 查找缓存
    int hit_flag = 0;
    for (int i = 0; i < MAX_CACHE_NUM;i++) {
        // 命中缓存
        if (!strcmp(cache.cache_files[i].url, url)) {
            // 更新时间戳，也是全局变量，需要加锁
            P(&mutex);
            cache.cache_files[i].timestamp = timestamp++;
            V(&mutex);
            // 发送缓存内容
            Rio_writen(rio_p->rio_fd, cache.cache_files[i].content, cache.cache_files[i].content_size);
            hit_flag = 1;
            break;
        }
    }

    // 同上，使用全局变量 readcnt，需要加锁
    P(&mutex);
    readcnt--;
    // 最后一个读者需要解锁，允许写者访问
    if (readcnt == 0) {
        V(&w);
    }
    V(&mutex);
    if (hit_flag) {
        return 1;
    }
    return 0;
}


int add_cache(string url, char* content, int content_size) {
    // 同一时间只允许一个写者访问，需要持有 w 锁
    P(&w);
    // 检查缓存是否已满
    // 缓存已满
    if (cache.using_cache_num == (MAX_CACHE_NUM - 1)) {
        // 找到最旧的缓存
        int oldest_index = 0;
        int oldest_timestamp = timestamp; // 初始化为当前最大时间戳，或者直接取第一个元素的时间戳
        
        // 先初始化 oldest_timestamp 为一个可能的值，比如第一个元素的时间戳
        if (cache.using_cache_num > 0) {
             oldest_timestamp = cache.cache_files[0].timestamp;
        }

        for (int i = 0;i < MAX_CACHE_NUM;i++) {
            if (cache.cache_files[i].timestamp < oldest_timestamp) {
                oldest_timestamp = cache.cache_files[i].timestamp;
                oldest_index = i;
            }
        }
        // 替换缓存
        strcpy(cache.cache_files[oldest_index].url, url);
        memcpy(cache.cache_files[oldest_index].content, content, content_size);
        cache.cache_files[oldest_index].content_size = content_size;
        // 更新时间戳，加锁
        P(&mutex);
        cache.cache_files[oldest_index].timestamp = timestamp++;
        V(&mutex);
    }
    // 缓存未满
    else {
        // 添加缓存
        strcpy(cache.cache_files[cache.using_cache_num].url, url);
        memcpy(cache.cache_files[cache.using_cache_num].content, content, content_size);
        cache.cache_files[cache.using_cache_num].content_size = content_size;
        // 更新时间戳，加锁
        P(&mutex);
        cache.cache_files[cache.using_cache_num].timestamp = timestamp++;
        V(&mutex);
        cache.using_cache_num++;
    }
    // 解锁
    V(&w);
    return 0;
}
```
另外不要忘记在`cache.h`正确的声明和函数中调用cache。

## 后记
经过我三天打鱼两天晒网的赶工，终于写完了CSAPP的所有实验的笔记（你问我为什么不写NEMU？因为我也没学明白！）。Blog年前告一段落，年后争取继续更新。

*免责声明*：
本文的解析参考了[TJU Course Sharing](https://cs.tjuse.com/zh-CN/)中的部分内容，并借助AI工具进行整理。
解析仅供参考，不得抄袭！