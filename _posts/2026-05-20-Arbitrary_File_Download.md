---
layout: post
title: "任意文件下载"
tags: 任意文件下载
date: 2026-05-20
---
# 任意文件下载
## 一.介绍

一些网站由于业务需求，往往需要提供文件查看或文件下载功能，但若对用户查看或下载的文件不做限制，则恶意用户就能够查看或下载任意敏感文件，这就是文件查看与下载漏洞。属于owasp top10 的失效的访问控制类型了。

## 示例

![image-20260519195132489](/assets/images/10/image-20260519195132489.png)

我们通过网页提供的链接进行文件的下载 

`execdownload.php?filename=xxxx` #PHP 下载接口文件，专门用来执行文件下载  

`http://192.168.179.130/pikachu/vul/unsafedownload/execdownload.php?filename=kb.png` #有些恶意人员通过尝试修文件的名称去访问其他的文件，以下是可以下载的文件

![image-20260520213220178](/assets/images/10/image-20260520213220178.png)

**目录穿透符**`../`,这个起到是回到上一层目录的作用

`http://192.168.179.130/pikachu/vul/unsafedownload/execdownload.php?filename=../../xx.png`

如果在上上层目录中存在xx.png，那么就会被下载下来

## 产生原因

源代码：`$file_path="download/{$_GET['filename']}";`

这里对传入的参数并没有做任何的处理

没有在php.ini中配置open_baswdir参数，达到只能访问的路径

![image-20260520215234067](/assets/images/10/image-20260520215234067.png)

效果如下

![image-20260520215851817](/assets/images/10/image-20260520215851817.png)

不允许访问指定路径以外的路径

## 利用方式

存在文件下载的关键字的形式

| 一般链接形式           | 或者包含参数 |
| ---------------------- | ------------ |
| download.php?path=     | &Src=        |
| down.php?file=         | &Inputfile=  |
| data.php?file=         | &Filepath=   |
| download.php?filename= | &Path=       |
|                        | &Data=       |

我们可以通过谷歌高级搜索探测某个网站是否有文件下载功能，然后去测试

```
site:域名 inurl:上面的参数
```

## 利用思路

(1)下载常规的配置文件，例如: ssh,weblogic,ftp,mysql等相关配置

(2)下载各种.log文件，从中寻找一些后台地址，文件上传点之类的地方，如果运气好的话会获得一些前辈们的后门。

(3)如果是linux系统的话，尝试读取/root/.bash_history看自己是否具有root权限。如果没有的话。我们只能按部就班的利用../来回跳转读取一些.ssh下的配置信息文件，读取mysql下的.bash_history文件。来查看是否记录了一些可以利用的相关信息。然后逐个下载我们需要审计的代码文件，但是下载的时候变得很繁琐，我们只能尝试去猜解目录，然后下载一些中间件的记录日志进行分析。

(4)如果我们遇到的是java+oracle环境，可以先下载/WEB-INF/classes/applicationContext.xml 文件，这里面记载的是web服务器的相应配置，然后下载/WEB-INF/classes/xxx/xxx/ccc.class对文件进行反编译，然后搜索文件中的upload关键字看是否存在一些api接口，如果存在的话我们可以本地构造上传页面用api接口将我们的文件传输进服务器，如果具有root权限，在linux中有这样一个命令 locate 是用来查找文件或目录的，它不搜索具体目录，而是搜索一个数据库/var/lib/mlocate/mlocate.db。这个数据库中含有本地所有文件信息。Linux系统自动创建这个数据库，并且每天自动更新一次。当我们不知道路径是什么的情况下，这个可以说是一个核武器了，我们利用任意文件下载漏洞mlocate.db文件下载下来，利用locate命令将数据输出成文件，这里面包含了全部的文件路径信息。

 locate 读取方法: locate mlocate.db admin //可以将mlocate.db中包含admin文件名的内容全部输出来

## 常见的利用文件  

SSH 密钥相关

| 文件路径 | 作用说明 |
| ---- | ---- |
| /root/.ssh/authorized_keys | 存放客户端公钥，实现SSH免密登录 |
| /root/.ssh/id_rsa | SSH本地私钥，高危敏感文件 |
| /root/.ssh/id_ras.keystore | 自定义密钥存储文件，多用于密钥凭证管理 |
| /root/.ssh/known_hosts | 记录已连接远程主机公钥，防中间人攻击 |

系统用户密码相关
| 文件路径 | 作用说明 |
| ---- | ---- |
| /etc/passwd | 存储系统所有用户基础信息，全员可读 |
| /etc/shadow | 存储用户加密密码、密码有效期等，仅root可读 |

服务配置文件
| 文件路径 | 作用说明 |
| ---- | ---- |
| /etc/my.cnf | MySQL数据库主配置文件 |
| /etc/httpd/conf/httpd.conf | Apache网站服务主配置文件 |

历史操作记录文件
| 文件路径 | 作用说明 |
| ---- | ---- |
| /root/.bash_history | root用户执行过的所有Linux历史命令 |
| /root/.mysql_history | MySQL数据库执行过的SQL历史命令 |

系统内核与进程相关
| 文件路径 | 作用说明 |
| ---- | ---- |
| /proc/mounts | 查看系统当前所有挂载设备与目录 |
| /proc/config.gz | Linux内核编译配置压缩文件 |
| /var/lib/mlocate/mlocate.db | 系统全局文件索引库，locate命令依赖 |
| /proc/self/cmdline | 查看当前进程启动命令及参数 |

## 如何修复

（1）过滤"."，使用户在url中不能回溯上级目录 不能目录穿越 ../../

（2）正则严格判断用户输入参数的格式，设置白名单

（3）php.ini配置open_basedir限定文件访问范围



## 路径扫描工具

dirsearch
