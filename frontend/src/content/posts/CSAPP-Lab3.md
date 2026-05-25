---
title: CSAPP Lab 3 - Bomb Lab 实验解析
date: 2026-02-10 18:35:17
tags: [CSAPP, Assembly, Reverse Engineering, GDB]
categories: [CSAPP]
---

## 实验目的
进一步掌握程序的机器级表示一章的知识。理解程序控制、过程调用的汇编级实现，熟练掌握汇编语言程序的阅读。 

## 实验内容
程序 `bomb` 是一个电子炸弹，当该程序运行时，需要按照一定的顺序输入口令，才能阻止炸弹的引爆。当输入错误的密码时，炸弹将会引爆。 

在炸弹程序中，你需要输入多组口令，且每一组口令都正确才能够防止引爆。目前已知的内容只有炸弹程序的二进制可执行文件 `bomb`（目标平台为：x86-64）和 `bomb` 的 `main` 函数框架代码。你的任务是：利用现有的资源以及相关的工具，猜出炸弹的全部口令，并输入至炸弹程序中，以完成最终的拆弹工作。 

## 实验结果和解析

### Phase 1

#### 汇编代码

![](/images/CSAPPLab3picture/p1ac.png)

#### 思路
这段代码首先调整栈指针，为函数调用分配 8 字节的栈空间，然后将立即数 `0x402400` 移动到 `%esi` 寄存器。随后调用 `strings_not_equal` 函数，函数的两个参数分别是地址为 `0x402400` 的固定字符串地址和输入的字符串地址。 

如果相等则返回 0，返回结果在 `%eax` 中。接下来检测 `%eax` 的值，如果为 0，零标志位会被设置为 1，否则置为 0。如果零标志位为 1 则跳转到地址 `400ef7`，跳过 `explode_bomb` 函数调用。根据 `gdb` 命令 `x/s 0x402400` 查看该地址下的字符串，得到答案。 

#### 结果
`Border relations with Canada have never been better.` 
![](/images/CSAPPLab3picture/p1as.png)

### Phase 2

#### 汇编代码

![](/images/CSAPPLab3picture/p2ac.png)

#### 思路
首先将 `rbp` 和 `rbx` 入栈，开辟 40 字节栈空间，将栈指针 `rsp` 传给 `rsi` 作为数组存储起始地址。调用函数读取 6 个整数。检查数组第一个元素是否为 1，若不是则爆炸。 

随后进入循环：`rbx` 指向第二个元素，`rbp` 指向最后一个元素。在循环中遍历每个元素，要求每个元素都是前一个元素的两倍，循环才能完整结束。 

#### 结果
`1 2 4 8 16 32`

### Phase 3

#### 汇编代码

![](/images/CSAPPLab3picture/p3ac.png)

#### 思路
代码通过 `sscanf` 读取两个整数。首先检查是否读入了至少一个数且第二个数不大于 7。接着根据第二个参数的值，从跳转表 `0x402470` 中获取对应地址并跳转。 

这是一个典型的 `switch-case` 结构，将 0 到 7 的每一个 $x$ 与一个特定的数值 $z$ 对应，只有当输入的第一个整数与该 $z$ 相等时才不会爆炸。 

通过`x/gx`指令，查询到`0x402470`指向的内容是`0x0000000000400f7c`，使用` x/16a 0x402470`查看跳转表

![](/images/CSAPPLab3picture/p3gdb.png)

#### 结果
`0 207` 或 `1 311`（任选一组）

### Phase 4

#### 汇编代码

![](/images/CSAPPLab3picture/p4ac.png)
![](/images/CSAPPLab3picture/p4ac2.png)

#### 思路
读取两个整数，检查数量及第二个数是否 $\le 14$。随后以输入的第一个数、0、14 为参数调用 `func4`。 

`func4` 是一个递归函数，其功能是**二分查找**。逻辑是：在 0 到 14 的范围内通过二分法找出元素 $x$。若要在二分查找过程中满足返回值为 0，且输入的第二个数也为 0。 

#### 结果
任选其一：`0 0` , `1 0`, `3 0`, `7 0`

### Phase 5

#### 汇编代码

![](/images/CSAPPLab3picture/p5ac.png)

#### 思路

第一部分进行栈空间的分配和设置栈金丝雀进行栈保护，然后调用`string_length`函数获取输入字符串的长度。如果长度不等于 `6`，调用 `explode_bomb`。

第二部分遍历六个字符：将字符与`0xf`进行按位与操作，然后从查找表`0x4024b0`中获取对应的字符，并将转换后的字符存储到新字符串中。最后在新字符串末尾添加终止符`\0`。

第三部分将转换后的字符串与目标字符串`0x40245e`进行比较。如果不相等，调用`explode_bomb`。

第四部分是栈保护的检查和栈空间清理

使用gdb调试查看`0x4024b0`和`0x40245e`处的字符串

![](/images/CSAPPLab3picture/p5gdb.png)
![](/images/CSAPPLab3picture/p5gdb2.png)

与`0xf`与操作意味着能取到`0x4024b0`处字符串的范围`0-15`，也就是`maduiersnfotvby`。`flyers`六个字母对应`maduiersnfotvbyl`的下标分别为`9,15,14,5,6,7`。输入字符可以是任意字符，只要它们的低四位分别和`0x9, 0xc, 0xf, 0xe, 0xd, 0x12`匹配即可。

#### 结果
`ionefg`

### Phase 6

#### 汇编代码

![](/images/CSAPPLab3picture/p6ac.png)
![](/images/CSAPPLab3picture/p6ac2.png)
![](/images/CSAPPLab3picture/p6ac3.png)
![](/images/CSAPPLab3picture/p6ac4.png)

#### 思路
1. 读取六个整数，要求每个数字在 1 到 6 之间且互不相同。 
2. 对数组执行 `array[i] = 7 - array[i]` 操作。 
3. 核心逻辑涉及一个位于 `0x6032d0` 的链表。程序会根据输入的数值对链表节点进行重新排序。 
4. 最后检查重排后的链表节点数值是否按**降序**排列。根据调试数据，正确的链表节点顺序对应的原始输入需经过补数转换。 

使用`x/s`查看`0x6032d0`地址的内容，发现是一个节点，进而使用`x/128x`查看链表的完整信息

![](/images/CSAPPLab3picture/p6gdb.png)

#### 结果
`4 3 2 1 6 5` 

### Secret Phase 

#### 汇编代码

![](/images/CSAPPLab3picture/spac.png)

#### 思路
通过搜索可知调用`secret_phase`的函数是`phase_defused`，查看其中地址的内容并结合后续代码可以判断，在合适的位置输入两个整数和字符串`DrEvil`就可以进入隐藏关了。

![](/images/CSAPPLab3picture/spgdb.png)

在`phase_defused`中可以知道`fun7`的返回值数量是2，查看`0x6030f0`处内容

![](/images/CSAPPLab3picture/spgdb2.png)

根据节点的关系，可以画出结构图，从图中可知这是一个二叉搜索树.`fun7` 返回值的计算逻辑是：向左子树移动则返回 $2 \times \text{result}$，向右子树移动则返回 $2 \times \text{result} + 1$。为了让最终返回值为 2，需要从根节点 `36` 开始，先向左走到 `8`，再向右走到 `22`。

![](/images/CSAPPLab3picture/sptree.png)

#### 结果
`22` 

## 结算画面

![](/images/CSAPPLab3picture/spas.png)

这里还有一个小问题是第七行输入之后一定要再敲一个回车，不然会导致第七行读不进去，这个莫名其妙的问题当初困扰了我很久。

## 总结
Lab3有两个核心，其一是熟悉汇编语言，能读懂简单的汇编代码，建议反复揣摩课件上的内容，自己动手写一下。其二是熟练使用GDB和objdump等工具进行逆向工程，工具的具体使用方法课上不会涉及，需要自行学习，一定要自己动手做才能掌握逆向的思想。

*免责声明*：
本文的解析参考了[TJU Course Sharing](https://cs.tjuse.com/zh-CN/)中的部分内容，并借助AI工具进行整理。
解析仅供参考，不得抄袭！