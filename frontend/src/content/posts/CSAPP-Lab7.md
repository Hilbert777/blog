---
title: CSAPP Lab 7 - Malloc 实验解析
date: 2026-02-12 18:01:05
tags: [CSAPP, Malloc, Systems Programming]
categories: [CSAPP]
---

## 隐式空闲链表 + 首次适配 + 立即合并

首先还是磨刀不误砍柴工，先去复习课件中关于动态内存分配的基础知识。虽然我一直建议看课件，但是如果看了课本就会发现，在课本600页前后已经有了使用隐式空闲链表实现malloc的示例代码，这一部分代码在智慧树课程资源里也有同样的，具体路径为：计算机系统基础2-相关代码`csapp-code/vm/malloc/mm.c`。如果觉得自己无中生有直接开始写有困难，可以先参考课本上给出的实现找一些灵感。

这一部分代码我也不再文中赘述，我们直接开始来分析它有什么不足：
* 初始化`malloc`采用了隐式空闲链表，这样做没有使用额外的指针来串联空闲块。相反，它通过块头部中的大小字段（Size），隐式地遍历整个堆。这样做意味着在寻找空闲块时，必须遍历已分配的块和空闲块，直到找到合适的块。
* 合并策略采用了立即合并，利用边界标记，在`mm_free`或`extend_heap`被调用时，会立即检查当前块的前一个块和后一个块是否空闲。如果空闲，则立即利用`coalesce`函数将它们合并成一个更大的块。
* `mm_realloc`的实现非常简单粗暴。不检查当前块是否可以原地扩展或收缩。直接`mm_malloc`一块新内存，然后`memcpy`复制旧数据，最后`mm_free`释放旧块。

## 分离空闲链表 + 最优适配 + 立即合并

因此，不难想到后续可以从对应的方面进行优化：
* 隐式空闲链表是时间复杂度是 $O(N)$ 的（$N$是所有块的数量），但是如果把空闲块的`Payload`区域中增加`prev`和`next`指针，只将空闲块串联起来。这样查找时间减少为 $O(K)$（$K$为空闲块数量）。然后可以进一步引入分离空闲链表，更大程度上提高吞吐量。
* 当前`realloc`的逻辑过于简单，总是`Malloc-Copy-Free`，浪费了大量的空间和时间，所以下一步应该进一步优化。但是当时我没有想出来太好的优化策略，所以在第三个版本才改进了这个功能。
* 首次适配算法显然不是最优的算法，所以可以考虑最优适配算法。
具体的代码实现其实是在模板版本的基础上做一点微调，这里也不再赘述。

## 分离空闲链表 + 最优适配 + 分类合并

把隐式空闲链表改成分离空闲链表之后，吞吐量方面有了显著的提高，总得分也达到了80+，但是适配策略对得分的提高并不明显，因为两种适配策略在吞吐量和空间利用率上各有利弊。
当前版本的代码在吞吐量上的优化已经得到了满分，但是空间利率上还有很大的提升空间，究其原因，还是碎片化处理做的很不好，导致了大量的外部碎片。要想处理好外部碎片，必须综合考虑多种情况，在每种情况下都适当找出来一个尽可能让外部碎片小的情况
* 原地收缩：如果用户要求变小，直接分割当前块，把多余的部分释放回空闲链表，不需要移动数据。
* 向后扩展：如果当前块后面的那个块是空闲的，且两者加起来够大，直接吃掉后面的块，不需要移动数据。
* 向前扩展：如果当前块的前一个块是空闲的，将数据移动到前一个块的起始位置，合并两者。这虽然需要`memmove`，但比重新 `malloc`更有可能成功利用碎片。（这个按照逻辑来说是反常理的，但是我根据测试点8的空间利用率一直比较低反退出来可能需要这样做，虽然最后对结果的影响也不明显吧）
* 前后同时扩展：如果前后都空闲，直接三合一。

```c
void* mm_realloc(void *ptr, size_t size)
{
    void *new_block = ptr;
    size_t oldsize;
    size_t asize;
    
    if (size == 0) {
        mm_free(ptr);
        return NULL;
    }

    if (ptr == NULL) {
        return mm_malloc(size);
    }

    if (size <= DSIZE) {
        asize = 2 * DSIZE;
    } else {
        asize = ALIGN(size + DSIZE);
    }

    oldsize = GET_SIZE(HDRP(ptr));

    /* Case 1: 缩小或大小不变 */
    if (oldsize >= asize) {
        size_t remainder = oldsize - asize;
        if (remainder >= 2 * DSIZE) {
            PUT(HDRP(ptr), PACK(asize, 1));
            PUT(FTRP(ptr), PACK(asize, 1));
            
            void *next = NEXT_BLKP(ptr);
            PUT(HDRP(next), PACK(remainder, 0));
            PUT(FTRP(next), PACK(remainder, 0));
            
            insert_node(next, remainder);
            coalesce(next);
        }
        return ptr;
    }

    /* Case 2: 向后扩展 (Next Block) */
    void *next = NEXT_BLKP(ptr);
    size_t next_alloc = GET_ALLOC(HDRP(next));
    size_t next_size = GET_SIZE(HDRP(next));
    size_t total_avail = oldsize;

    if (!next_alloc || next_size == 0) {
        if (!next_alloc) {
            total_avail += next_size;
        }
        
        /* 如果不够，且位于堆顶，尝试扩展 */
        if (total_avail < asize) {
            void *end_check = next;
            if (!next_alloc) end_check = NEXT_BLKP(next);
            
            if (GET_SIZE(HDRP(end_check)) == 0) { /* 是结尾块 */
                size_t extend_needed = asize - total_avail;
                size_t extend_size;
                
                if (extend_needed < CHUNKSIZE) {
                     extend_size = extend_needed; 
                } else {
                     extend_size = ALIGN(extend_needed);
                }
                extend_size = ALIGN(extend_size);

                void *p;
                if ((long)(p = mem_sbrk(extend_size)) == -1)
                    return NULL;
                
                PUT(HDRP((char *)p + extend_size), PACK(0, 1)); /* 新结尾块 */
                total_avail += extend_size;
            }
        }

        if (total_avail >= asize) {
            if (!next_alloc) delete_node(next);
            
            size_t remainder = total_avail - asize;
            if (remainder >= 2 * DSIZE) {
                PUT(HDRP(ptr), PACK(asize, 1));
                PUT(FTRP(ptr), PACK(asize, 1));
                
                void *new_next = NEXT_BLKP(ptr);
                PUT(HDRP(new_next), PACK(remainder, 0));
                PUT(FTRP(new_next), PACK(remainder, 0));
                
                insert_node(new_next, remainder);
                coalesce(new_next); /* <--- 添加这一行：尝试合并剩余块 */
            } else {
                PUT(HDRP(ptr), PACK(total_avail, 1));
                PUT(FTRP(ptr), PACK(total_avail, 1));
            }
            return ptr;
        }
    }

    /* Case 3: 向前扩展 (Previous Block) - 针对 Trace 8 的关键优化 */
    void *prev = PREV_BLKP(ptr);
    size_t prev_alloc = GET_ALLOC(HDRP(prev));
    size_t prev_size = GET_SIZE(HDRP(prev));

    /* 3.1: 仅合并前驱 */
    if (!prev_alloc && (oldsize + prev_size >= asize)) {
        delete_node(prev);
        
        void *new_ptr = prev;
        /* 移动数据到前驱位置 (使用 memmove 处理重叠) */
        memmove(new_ptr, ptr, oldsize - DSIZE);
        
        size_t total_size = oldsize + prev_size;
        size_t remainder = total_size - asize;
        
        if (remainder >= 2 * DSIZE) {
            PUT(HDRP(new_ptr), PACK(asize, 1));
            PUT(FTRP(new_ptr), PACK(asize, 1));
            
            void *next_blk = NEXT_BLKP(new_ptr);
            PUT(HDRP(next_blk), PACK(remainder, 0));
            PUT(FTRP(next_blk), PACK(remainder, 0));
            insert_node(next_blk, remainder);
            coalesce(next_blk); /* <--- 添加这一行：尝试合并剩余块 */
        } else {
            PUT(HDRP(new_ptr), PACK(total_size, 1));
            PUT(FTRP(new_ptr), PACK(total_size, 1));
        }
        return new_ptr;
    }

    /* 3.2: 合并前驱 + 后继 */
    if (!prev_alloc && !next_alloc) {
        size_t total_size = oldsize + prev_size + next_size;
        if (total_size >= asize) {
            delete_node(prev);
            delete_node(next);
            
            void *new_ptr = prev;
            memmove(new_ptr, ptr, oldsize - DSIZE);
            
            size_t remainder = total_size - asize;
            if (remainder >= 2 * DSIZE) {
                PUT(HDRP(new_ptr), PACK(asize, 1));
                PUT(FTRP(new_ptr), PACK(asize, 1));
                
                void *next_blk = NEXT_BLKP(new_ptr);
                PUT(HDRP(next_blk), PACK(remainder, 0));
                PUT(FTRP(next_blk), PACK(remainder, 0));
                insert_node(next_blk, remainder);
                //coalesce(next_blk);
            } else {
                PUT(HDRP(new_ptr), PACK(total_size, 1));
                PUT(FTRP(new_ptr), PACK(total_size, 1));
            }
            return new_ptr;
        }
    }

    /* Case 4: 无法原地调整，只能重新分配 */
    new_block = mm_malloc(size); 
    if (new_block == NULL) return NULL;
    
    size_t copy_size = oldsize - DSIZE; 
    memcpy(new_block, ptr, copy_size);
    
    mm_free(ptr);
    return new_block;
}
```
## 后记
理论上到这里malloc实验就可以完结了，但是读者可能会疑惑我好像说了很多又好像什么都没说，这里我解释一下原因。一方面是malloc的精华就在于一次次的调试和优化直到最优的版本，但是我没有留存中间过程的源码，只保存了最终结果，直接把最终代码贴出来相当于什么都没说。本来我是想跳过这一篇的，但是为了本系列的完整性还是写了。另一方面是malloc实验是很难拿到满分的，大部分人的最终得分是97-99之间，但是没有见到过100分的，我写文章重新回顾实验也没想到怎么做到，所以我略去了一些不成熟的想法，以便于尽可能的少限制读者的思路。如果有读者能在此基础上优化到满分我将倍感荣幸。一定要追求满分的可以参考一位北大佬的博客：[更适合北大宝宝体质的 Malloc Lab 踩坑记](https://zhuanlan.zhihu.com/p/680186995)，这位佬的其他博客（包括但不限于CSAPP）都值得研究，比我写的强得多。
*免责声明*：
本文的解析参考了[TJU Course Sharing](https://cs.tjuse.com/zh-CN/)中的部分内容，并借助AI工具进行整理。
解析仅供参考，不得抄袭！

