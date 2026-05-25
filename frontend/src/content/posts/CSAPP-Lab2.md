---
title: CSAPP Lab2 - Ints and Floats 实验解析
date: 2026-02-10 16:15:26
tags: [CSAPP, Systems Programming, C, Bit Manipulation]
categories: [CSAPP]
---

##  前言
原计划是用全英语写博客，但是写了一篇之后发现用英语不仅是折磨自己也是折磨读者，所以以后还是用中文写吧。

##  实验目标
本实验旨在熟悉整型（Integer）和浮点型（Floating Point）数据的编码方式，并通过限制使用特定的位操作符来实现复杂的逻辑运算。

---

## 解析

### Q1: conditional(x, y, z)
**函数说明**：实现三目运算符 `x ? y : z`。
**操作限制**：最多 16 个操作符。

```c
int conditional(int x, int y, int z) {
    // 1. 将 x 转换为布尔值标记：x 为 0 时 flag=1，x 非 0 时 flag=0
    int flag = !x;
    
    // 2. 构造掩码：
    // 如果 x 不为 0，a 变为全 1 (0xFFFFFFFF)，否则为全 0
    int a = (!flag << 31) >> 31;
    
    // 3. 构造反向掩码：
    // 如果 x 为 0，b 变为全 1，否则为全 0
    int b = (flag << 31) >> 31;
    
    return (y & a) | (z & b);
}
```

**设计思路**：回顾三目运算符的规则，当 $x$ 非零时执行 $y$，而 $x$ 为零时执行 $z$。通过 `!` 运算符将 $x$ 映射为 $0$ 或 $1$，再利用算术右移的特性构造全 $1$ 或全 $0$ 的掩码。将掩码与 $y$、$z$ 进行按位与运算，即可筛选出正确的结果。

### Q2: isNonNegative(x)
**函数说明**：判断 $x \ge 0$，如果是则返回 1，否则返回 0。
**操作限制**：最多 6 个操作符。
```c
Cint isNonNegative(int x) {
    // 获取符号位：正数为 0，负数为 1
    int flag = (x >> 31) & 0x01;
    // 取反返回
    return !flag;
}
```

**设计思路**：只需要提取整数的最高位（符号位）。在补码表示中，符号位为 $0$ 表示非负数，为 $1$ 表示负数。

### Q3: isGreater(x, y)
**函数说明**：如果 $x > y$ 返回 1，否则返回 0。
**操作限制**：最多 24 个操作符。

```c
int isGreater(int x, int y) {
    // 获取 x-y-1 的符号位（用于判断同号情况）
    int diff_minus_one = x + (~y); 
    int symbol = (diff_minus_one >> 31) & 0x01;
    
    // 获取 x 和 y 的符号位
    int symbol_x = (x >> 31) & 0x01;
    int symbol_y = (y >> 31) & 0x01;
    
    // 判断 x 和 y 是否异号
    int is_different = symbol_x ^ symbol_y;
    
    // 情况 1: x 和 y 异号，且 x 为非负 (0)，y 为负 (1)
    int case1 = is_different & (symbol_y & (~symbol_x));
    
    // 情况 2: x 和 y 同号，且 x-y-1 的结果为非负 (符号位为 0)
    int case2 = (!is_different) & (!symbol);
    
    return case1 | case2;
}
```

**设计思路**：关键在于分类讨论以避免溢出。如果 $x$ 和 $y$ 同号，直接计算 $x-y-1$ 的符号位，若结果 $\ge 0$ 则 $x > y$。如果 $x$ 和 $y$ 异号，直接判断 $x$ 是否为非负且 $y$ 为负，这样可以规避 $x-y$ 可能产生的溢出问题。

### Q4: absVal(x)
**函数说明**：计算 $x$ 的绝对值。
**操作限制**：最多 10 个操作符。

```c
int absVal(int x) {
    int symbol, positive_or_zero, negative;
    
    // 获取符号掩码：x 为负则全 1，非负则全 0
    symbol = (x >> 31);
    
    // 如果 x 为非负，positive_or_zero = x
    positive_or_zero = (~symbol) & x;
    
    // 如果 x 为负，使用补码取反加一逻辑：negative = -x
    negative = symbol & (~x + 1);
    
    return positive_or_zero + negative;
}
```

**设计思路**：利用符号位构造掩码。当 $x$ 为非负数和负数时，positive_or_zero 和 negative 两个变量会恰好有一个保持原值/取反加一，另一个变为 $0$。最后相加即可。

### Q5: isPower2(x)
**函数说明**：判断 $x$ 是否为 2 的幂。
**操作限制**：最多 20 个操作符。

```c
int isPower2(int x) {
    // 利用 x & (x-1) == 0 的性质
    int flag = x & (x + ~0);
    int symbol = (x >> 31) & 0x01;
    
    // 需满足：flag 为 0，符号位为 0（非负），且 x 不等于 0
    return (!flag) & (!symbol) & (!!x);
}
```
**设计思路**：2 的幂在二进制表示中仅有一位为 $1$。利用 x & (x-1)（即 x & (x+~0)）的性质，该运算会消除最低位的 $1$。如果消除后为 $0$，说明原数仅有一位 $1$。最后排除负数和 $0$ 的特殊情况。

### Q6: float_neg(unsigned uf)
**函数说明**：返回浮点数 -f 的位级表示。如果是 NaN，则返回原值。

```c
unsigned float_neg(unsigned uf) {
    unsigned result;
    int no_sign_uf = uf & 0x7fffffff; // 屏蔽符号位
    int exp = (uf >> 23) & 0xff;      // 提取阶码
    
    // 判断是否为 NaN：阶码全为 1 且 尾数不全为 0
    if ((exp == 0xff) && (no_sign_uf > 0x7f800000)) {
        return uf;
    }
    
    // 符号位取反：通过异或最高位实现
    result = uf ^ 0x80000000;
    return result;
}
```
**设计思路**：浮点数取反只需修改符号位。关键在于识别 NaN：根据 IEEE 754 标准，当阶码（Exponent）全为 $1$ 且尾数（Fraction）不为 $0$ 时，该值为 NaN，此时需原样返回。

### Q7: float_i2f(int x)
**函数说明**：将整型 int 转换为单精度浮点数 float 的位级表示。

```c
unsigned float_i2f(int x) {
    int symbol, high = 0, exp, flag = 0;
    unsigned result, temp;

    if (!x) return 0; // 处理 0 的情况

    // 1. 处理符号
    symbol = (x >> 31) & 0x01;
    temp = symbol ? (~x + 1) : x; // 取绝对值

    // 2. 找到最高有效位的位置
    unsigned copy_temp = temp;
    while (!(copy_temp & 0x80000000)) {
        copy_temp <<= 1;
        high++;
    }

    // 3. 计算阶码 (Bias = 127)
    exp = 127 + 31 - high;
    
    // 4. 处理尾数与舍入 (向偶数舍入)
    copy_temp <<= 1; // 移出隐藏位
    if ((copy_temp & 0x1ff) > 0x100) flag = 1;
    if ((copy_temp & 0x3ff) == 0x300) flag = 1;

    result = (symbol << 31) + (exp << 23) + (copy_temp >> 9) + flag;
    return result;
}
```
**设计思路**：这是实验中最复杂的题目，分为六步：
* 处理特例 $0$。
* 获取 $x$ 的绝对值并记录原符号。
* 通过循环左移找到最高有效位（MSB），确定阶码。
* 根据 MSB 位置截取尾数。
* 舍入处理：遵循 IEEE 754 的“向最接近的值舍入，中间值向偶数舍入”原则。
* 拼接符号、阶码和尾数。

## 总结
主要的思想方法和Lab1差不多，需要熟悉各种运算规则和IEEE 754标准，如果有想不起来的地方建议看PPT或课本多加回顾

*免责声明*：
本文的解析参考了[TJU Course Sharing](https://cs.tjuse.com/zh-CN/)中的部分内容，并借助AI工具进行整理。
解析仅供参考，不得抄袭！