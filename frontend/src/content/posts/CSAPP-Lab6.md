---
title: CSAPP Lab 6 - Shell 实验解析
date: 2026-02-12 17:24:53
tags: [CSAPP, Malloc, Systems Programming]
categories: [CSAPP]
---

>查看tsh.c（微型shell）文件，你会看到它包含一个简单Unix shell的功能骨架。为了帮助你快速上手，我们已经实现了一些较不重要的函数。你的任务是完成下面列出的剩余空函数。为了帮助你进行合理检查，我们已在我们的参考解决方案中列出了每个函数的代码行数的近似值（其中包含大量注释）。 
* eval：解析和解释命令行的主例程。
* 【70行】 builtin cmd：识别和解释内置命令：quit、fg、bg和jobs。【25行】 
* do_bgfg：实现bg和fg内置命令。【50行】 
* waitfg：等待前台作业完成。【20行】 
* sigchld handler：捕获 SIGCHILD 信号。【80行】 
* sigint handler：捕获 SIGINT（ctrl-c）信号。【15 行】 
* sigtstp handler：捕获 SIGTSTP（ctrl-z）信号。【15 行】

## eval
eval是一个解析和解释命令行的主例程，需要我们实现的功能有如下两个：解析命令行后判断为内置命令还是程序路径。如果输入是内建命令则立即执行；否则`fork`子进程，在子进程上下文运行该作业。判断是前台还是后台，如果是前台作业，就等它结束再返回；如果是后台作业，则要输出其相应信息。
首先根据README的提示，参考了已经实现了的函数的基本功能，可以用`parseline`函数实现命令行解析并构造 argv 数组。解析后如果是内建命令直接转到`builtin_cmd`处理，否则继续在`eval`中处理。
接下来在正式开始子进程的创建之前，我们需要先完成一系列的准备工作：根据所学知识，`fork`之后父进程要先`addjob`，子进程可能立刻`exit`并发出`SIGCHLD`。如果信号处理函数先跑，它会在`jobs`表里找不到子进程（因为`addjob`还没跑），导致收尸失败或竞态。所以解决方案是：`fork`前临时把`SIGCHLD`屏蔽，`addjob`完成后再解除屏蔽。
然后就可以正式创建子进程了，如果失败了就恢复信号掩码并退出，成功了继续进行，自然而然的一步操作没有什么可说的。
后续就是对子进程的分支，因为子进程继承了父进程的状态，所以首先要把屏蔽的`SIGCHLD`解锁，并创建新进程组，调用`setpgid(0,0)`把ID设置为进程PID，这样以后`tsh`可以用`-pid`向整个组发信号。用`execvp`查找命令并替换当前进程；失败则打印并退出。这里要注意`execvp`出现失败同样也要有输出，我对照`rtest`看了好久才发现这个问题。
父进程的分支也是类似的道理，同样调用`setpgid`，如果子进程还没跑到自己的`setpgid`，父进程先给它建好进程组；如果子进程已经建好，`errno`会是`ESRCH`，忽略即可。
这样无论谁先跑，都保证子进程在一个独立组里。并且不要忘了接触父进程中对`SIGCHLD`的屏蔽。
最后是处理前后台作业，前台作业调用`wait`阻塞，等待其运行结束；后台作业则打印作业信息并返回控制台。

```c
void eval(char *cmdline) 
{
    char *argv[MAXARGS];
    pid_t pid;
    int bg;

    /* 解析命令行，构造 argv*/
    bg = parseline(cmdline, argv);
    if (argv[0] == NULL) {
        /* 空行：直接返回 */
        return;
    }

    /* 如果是内建命令则直接处理并返回 */
    if (builtin_cmd(argv)) {
        return;
    }

    /* 
     * 为避免与 SIGCHLD 处理器发生冲突（父进程在 fork 后立刻 addjob，
     * 而 SIGCHLD 可能更早到达并被处理），在 fork 前屏蔽 SIGCHLD。
     */
    sigset_t mask_all, prev;
    if (sigemptyset(&mask_all) == -1) {
        unix_error("sigemptyset error");
    }
    if (sigaddset(&mask_all, SIGCHLD) == -1) {
        unix_error("sigaddset error");
    }
    if (sigprocmask(SIG_BLOCK, &mask_all, &prev) == -1) {
        unix_error("sigprocmask block error");
    }

    /* 创建子进程执行命令 */
    pid = fork();
    if (pid < 0) {
        /* fork 失败，报错退出 */
        if (sigprocmask(SIG_SETMASK, &prev, NULL) == -1) {
            unix_error("sigprocmask restore after fork error");
        }
        unix_error("fork error");
    }

    if (pid == 0) { /* 子进程 */
        /* 子进程一开始解除父进程对 SIGCHLD 的屏蔽，避免影响子内库调用 */
        if (sigprocmask(SIG_SETMASK, &prev, NULL) == -1) {
            /* 子进程出错时直接退出，使用 _exit 保证不调用 stdio 清理 */
            _exit(1);
        }

        /* 将子进程放入新的进程组，便于向整个前台/后台组发送信号 */
        if (setpgid(0, 0) < 0) {
            /* 忽略错误 */
        }

        /* 用 execvp 查找命令并替换当前进程；失败则打印并退出 */
        if (execvp(argv[0], argv) < 0) {
            /* 写到 stderr（无缓冲），保证在 _exit 之后仍能被看到 */
            fprintf(stderr, "%s: Command not found\n", argv[0]);
            _exit(1);
        }
    } else { /* 父进程 */
        /* 父进程也尝试设置子进程进程组，避免子进程尚未执行 setpgid 时的竞态 */
        if (setpgid(pid, pid) < 0 && errno != ESRCH) {
            /* 忽略错误 */
        }

        int state = bg ? BG : FG;
        /* 在父进程中 addjob；此时子进程已创建且有 pid */
        if (!addjob(jobs, pid, state, cmdline)) {
            /* addjob 失败：恢复信号掩码并报告错误，但继续执行 */
            if (sigprocmask(SIG_SETMASK, &prev, NULL) == -1) {
                unix_error("sigprocmask restore after addjob error");
            }
            printf("Failed to add job for pid %d\n", pid);
            return;
        }

        /* 恢复父进程的信号（解除对 SIGCHLD 的屏蔽） */
        if (sigprocmask(SIG_SETMASK, &prev, NULL) == -1) {
            unix_error("sigprocmask restore error");
        }

        if (!bg) {
            /* 如果是前台作业，等待其完成 */
            waitfg(pid);
        } else {
            /* 后台作业：打印作业信息并立即返回控制台 */
            int jid = pid2jid(pid);
            printf("[%d] (%d) %s", jid, pid, cmdline);
        }
    }
    return;
}
```

## builtin_cmd

`builtin_cmd`的功能非常简答，判断输入是否是内建命令，如果是直接调用已经实现好了的对应函数即可，如果不是直接返回。不过要注意的是函数需要具有忽略一个单独的`&`的能力。
```c
int builtin_cmd(char **argv) 
{
    if (argv == NULL || argv[0] == NULL) {
        return 0;
    }/*若为空直接退出*/

    /* 忽略单独的 & */
    if (strcmp(argv[0], "&") == 0) {
        return 1;
    }

    /* quit: 直接终止 shell */
    if (strcmp(argv[0], "quit") == 0) {
        exit(0);
    }

    /* jobs: 打印作业列表 */
    if (strcmp(argv[0], "jobs") == 0) {
        listjobs(jobs);
        return 1;
    }

    /* bg / fg: 交由 do_bgfg 处理（函数负责参数检查和错误信息） */
    if (strcmp(argv[0], "bg") == 0 || strcmp(argv[0], "fg") == 0) {
        do_bgfg(argv);
        return 1;
    }
    /* 不是内建命令 */
    return 0;
}
```

## do_bgfg

这个函数的主要功能是区分前后台运行，首先是读取输入并检查合理性，然后需要区分是JID还是PID（以`%`为标志区分非常明显）。对于bg命令，只需要是向目标进程发送`SIGCONT`信号，让它继续执行；对于fg命令，调用`waitfg`等待进程结束。这里需要注意的是在`int kill(pid_t pid, int sig)`中，我们需要传入一个小于-1的pid，使得信号向进程组发送。

```c
void do_bgfg(char **argv) 
{
    struct job_t *job = NULL;
    pid_t pid = 0;
    int jid = 0;

    /* 参数检查 */
    if (argv[1] == NULL) {
        printf("%s command requires PID or %%jobid argument\n", argv[0]);
        return;
    }

    /* 如果以 '%' 开头，按 JID 解析 */
    if (argv[1][0] == '%') {
        /* 跳过 '%'，转换成整数 JID */
        jid = atoi(&argv[1][1]);
        if (jid <= 0) {
            printf("%s: argument must be a PID or %%jobid\n", argv[0]);
            return;
        }
        job = getjobjid(jobs, jid);
        if (job == NULL) {
            printf("%s: No such job\n", argv[1]);
            return;
        }
        pid = job->pid;
    } else {
        /* 否则按 PID 解析 */
        pid = (pid_t)atoi(argv[1]);
        if (pid <= 0) {
            printf("%s: argument must be a PID or %%jobid\n", argv[0]);
            return;
        }
        job = getjobpid(jobs, pid);
        if (job == NULL) {
            printf("(%d): No such process\n", pid);
            return;
        }
        jid = job->jid;
    }

    /* 向作业的进程组发送 SIGCONT，使用 -pid 表示进程组 */
    if (kill(-pid, SIGCONT) < 0) {
        /* 如果发送失败，打印错误信息但不退出 shell */
        fprintf(stdout, "Error: failed to send SIGCONT to %d: %s\n", pid, strerror(errno));
        /* 继续执行：对于 bg/fg 行为仍然尝试更新状态 */
    }

    /* 处理 bg 命令：设置为后台并打印信息 */
    if (strcmp(argv[0], "bg") == 0) {
        job->state = BG;
        printf("[%d] (%d) %s", job->jid, job->pid, job->cmdline);
        return;
    }

    /* 处理 fg 命令：设置为前台并等待其完成 */
    job->state = FG;

    /* waitfg 会阻塞直到pid不再是前台作业 */
    waitfg(job->pid);
    return;
}
```

## waitfg

这个函数要求实现阻塞父进程，直到当前的前台进程不再是前台进程，所以需要显式的等待信号。这里使用`sigsuspend`构建一个任何信号都能唤醒的查询，一旦接收到信号立即唤醒并对比PID，直到PID发生改变。

```c
void waitfg(pid_t pid)
{
    sigset_t mask_empty;
    int curfg;

    if (pid <= 0) {
        return;
    }

    /* 初始化一个空的信号集，sigsuspend 会以此为当前掩码并等待信号 */
    if (sigemptyset(&mask_empty) == -1) {
        unix_error("sigemptyset error in waitfg");
    }

    /* 循环直到前台作业不再是 pid */
    while ((curfg = fgpid(jobs)) == pid) {
        /* sigsuspend 暂时设置进程信号掩码为 mask_empty 并挂起等待信号 */
        if (sigsuspend(&mask_empty) == -1) {
            /* 当被信号中断时，sigsuspend 返回 -1 并设置 errno = EINTR*/
            if (errno != EINTR) {
                unix_error("sigsuspend error in waitfg");
            }
            /* 被信号中断后循环会再次检查 fgpid(jobs) */
        }
    }

    return;
}
```

## sigchld_handler

这是一个信号处理器，实现僵尸进程的回收并同步更新shell的jobs表。进入函数第一件事是备份`errno`，因为`handler`里调用的任何函数都可能改写`errno`。然后调用`waitpid`，通过传入参数-1，实现只要有一个子进程被信号终止或停止，就用非阻塞 `waitpid`循环全部收割，然后在jobs表中delete相应的进程。如果进程是被`Ctrl+Z`信号停止，这个时候不能删除，而是只改变状态。

```c
void sigchld_handler(int sig) 
{
    int olderrno = errno;
    //保护数据防止被更改
    pid_t pid;
    int status;

    /* 循环收集所有已经改变状态的子进程 */
    while ((pid = waitpid(-1, &status, WNOHANG | WUNTRACED)) > 0) {
        struct job_t *job = getjobpid(jobs, pid);

        /* 子进程正常退出 */
        if (WIFEXITED(status)) {
            /* 删除作业表项；忽略返回值，确保继续处理其他子进程 */
            deletejob(jobs, pid);
        }
        /* 子进程被信号终止*/
        else if (WIFSIGNALED(status)) {
            int signo = WTERMSIG(status);
            if (job) {
                printf("Job [%d] (%d) terminated by signal %d\n", job->jid, pid, signo);
            } else {
                printf("Job (%d) terminated by signal %d\n", pid, signo);
            }
            deletejob(jobs, pid);
        }
        /* 子进程被停止*/
        else if (WIFSTOPPED(status)) {
            int signo = WSTOPSIG(status);
            if (job) {
                job->state = ST;
                printf("Job [%d] (%d) stopped by signal %d\n", job->jid, pid, signo);
            } else {
                printf("Job (%d) stopped by signal %d\n", pid, signo);
            }
            /* 不删除作业（仍可通过 bg/fg 恢复） */
        }
    }

    /* waitpid 返回 -1 说明没有可回收的子进程或发生错误 */
    if (pid == -1 && errno != ECHILD && errno != EINTR) {
        fprintf(stdout, "sigchld_handler: waitpid error: %s\n", strerror(errno));
    }

    errno = olderrno;
    return;
}
```

## sigint_handler 和 sigtstp_handler

这两个函数的实现非常相似所以放在一起讨论。这两个函数的功能是当Shell收到`SIGINT`和`SIGSTP`信号时，将该信号转发至前台进程组。首先通过已经实现的`fgpid`获取前台进程的PID，然后通过`kill`将信号传给进程组，为了传给整个进程组要注意使用小于负一的参数，并且因为`fgpid`的全局性，所以要对数据做保护。

```c
void sigint_handler(int sig) 
{
    int olderrno = errno;
    pid_t pid = fgpid(jobs);

    /* 没有前台作业则直接返回 */
    if (pid == 0) {
        errno = olderrno;
        return;
    }

    /* 向前台作业的进程组发送 SIGINT（负 pid 表示进程组） */
    if (kill(-pid, SIGINT) < 0) {
        /* 如果进程组不存在（ESRCH），可忽略；其它错误打印提示 */
        if (errno != ESRCH) {
            fprintf(stdout, "sigint_handler: kill error: %s\n", strerror(errno));
        }
    }

    errno = olderrno;
    return;
}

void sigtstp_handler(int sig) 
{
    int olderrno = errno;
    pid_t pid = fgpid(jobs);

    /* 如果没有前台作业，直接返回 */
    if (pid == 0) {
        errno = olderrno;
        return;
    }

    /* 向前台作业的进程组发送 SIGTSTP（仅转发，不在此处打印或修改 job 状态） */
    if (kill(-pid, SIGTSTP) < 0) {
        /* 如果发送失败且不是因为进程不存在，打印错误信息（调试用） */
        if (errno != ESRCH) {
            fprintf(stdout, "sigtstp_handler: kill error: %s\n", strerror(errno));
        }
    }

    errno = olderrno;
    return;
}
```
## 提示
这里列举几个实验过程中可能踩到的坑：
* 几个函数是相互关联的，先实现哪个后实现哪个取决于实际做实验的时候的思路，在写某个函数的时候可以先用伪代码代替其他的函数或者默认某个函数已经正确实现，不要纠结于顺序。
* 给出的测试用例涉及到一个或多个函数，在完全写完之前不要纠结于通过了几个样例。
* 实验指导手册中给出的函数行数仅供参考，一般实际的实现只会比参考数据长。

*免责声明*：
本文的解析参考了[TJU Course Sharing](https://cs.tjuse.com/zh-CN/)中的部分内容，并借助AI工具进行整理。
解析仅供参考，不得抄袭！