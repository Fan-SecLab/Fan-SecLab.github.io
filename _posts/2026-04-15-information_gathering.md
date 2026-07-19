---

layout: post
title: "信息收集"
tags: 信息收集
---

# 🔍 信息收集

> 信息收集是渗透测试的第一步，也是最关键的一步。本文系统整理了域名信息、真实IP、端口服务、网站指纹、敏感信息等全方位收集方法与工具。

---

## 一、收集域名信息

### 1.1 域名注册信息

> 查询域名注册人、联系方式、服务器位置等 WHOIS 信息

| 平台 | 地址 |
|------|------|
| 站长之家 | <https://whois.chinaz.com/> |

**Kali 指令：**
```bash
whois baidu.com
```

---

### 1.2 SEO 信息收集

> 查网站公开页面、内容、后台、漏洞等 SEO 相关信息

- 站长之家：<https://whois.chinaz.com/>

---

### 1.3 子域名收集

> 通过字典爆破、拼接子域名后访问或 ping 探测（主动收集方式）

**在线工具：**
- <https://tool.chinaz.com/subdomain/>
- <https://site.ip138.com/2/domain.htm>

#### 工具推荐

| 工具 | 说明 | 用法 |
|------|------|------|
| **JSFinder** | 爬取单页面所有 JS 链接，从中发现 URL 和子域名 | `python3 JSFinder.py -u http://www.mi.com` |
| **subDomainsBrute** | 高并发 DNS 暴力枚举工具 | `python3 subDomainsBrute.py mi.com` |
| **subfinder** | 通过被动在线资源发现有效子域 | `./subfinder -d "mi.com"` |
| **OneForAll** | 执行时间长，搜索到的子域名多 | `python3 oneforall.py --target mi.com run` |

---

### 1.4 域名备案信息查询

> ICP 备案是网站的「身份证号」，网站在工信部完成官方认证后获得备案号。企业网站推广、平台入驻都需要 ICP 备案号，没有备案号的网站在互联网中寸步难行。

**ICP 备案号查询（通过备案号反查公司其他子域名）：**

| 平台 | 地址 |
|------|------|
| 工信部 | <https://beian.miit.gov.cn/#/Integrated/recordQuery> |
| 站长之家 | <https://icp.chinaz.com/> |
| 爱企查 | <https://aiqicha.baidu.com/> |
| 网站首页底部 | — |

---

### 1.5 SSL 证书查询

> HTTPS 网站需要注册 SSL 证书，申请时需提供公司信息和域名信息，因此可以通过 SSL 证书获取额外信息

| 平台 | 地址 |
|------|------|
| MySSL | <https://myssl.com/ssl.html> |
| Chinassl | <https://www.chinassl.net/ssltools/ssl-checker.html> |

---

### 1.6 综合信息收集工具

| 工具 | 说明 |
|------|------|
| **[ENScan GO](https://github.com/wgpsec/ENScan_GO)** | 默认收集公司信息（备案、微博、微信公众号、App） |
| **[superSearchPlus](https://github.com/dark-kingA/superSearchPlus)** | 谷歌浏览器插件 |

**ENScan 用法：**
```bash
# 单个公司查询
./enscan -n 小米

# 批量查询（文本按行分割）
./enscan -f f.txt
```

---

## 二、收集真实 IP

> CDN（Content Delivery Network）通过各地边缘服务器让用户就近获取内容，提高访问速度。但在渗透测试中，目标存在 CDN 会影响后续安全测试。

**国内 CDN 服务商：** 阿里云、百度云、七牛云、又拍云、腾讯云、Ucloud、360、网宿科技、ChinaCache

**国外 CDN 服务商：** CloudFlare、StackPath、Fastly、Akamai、CloudFront、Edgecast、CDNetworks、Google Cloud CDN

### 2.1 方法一：通过未加 CDN 的子域名查找真实 IP

### 2.2 方法二：超级 Ping 判断 CDN

多地 Ping 同一网址，所有地方指向同一 IP 则可能为真实 IP，从国外 Ping 找到的几率更大。

| 平台 | 地址 |
|------|------|
| PingLoc | <https://www.pingloc.com/> |
| 站长之家 Ping | <https://Ping.chinaz.com> |
| 17CE | <https://www.17ce.com/> |

### 2.3 方法三：基础命令

```bash
# Ping 测试
ping www.baidu.com

# DNS 查询记录，诊断网络问题
nslookup baidu.com

# Linux 下详细 DNS 查询
dig www.baidu.com
```

### 2.4 方法四：通过邮箱服务器 IP

> 进入邮箱 → 更多 → 查看信头，获取发件服务器真实 IP

### 2.5 方法五：通过系统漏洞或中间件漏洞直接获取 IP

### 2.6 方法六：CDN 绕过工具

| 工具 | 语言 | 地址 |
|------|------|------|
| **fuckcdn** | 易语言 | <https://github.com/Tai7sy/fuckcdn> |
| **w8fuckcdn** | Python 2.7 | <https://github.com/boy-hack/w8fuckcdn> |
| **Bypass_cdn** | Python 3 | <https://github.com/Pluto-123/Bypass_cdn> |

```bash
python3 scan.py https://www.mi.com
```

### 2.7 方法七：历史 DNS 解析

> 查询历史 DNS 记录，可能找到目标未使用 CDN 前的真实 IP

| 平台 | 地址 |
|------|------|
| 微步在线 | <https://x.threatbook.cn/> |
| DNSDB | <https://dnsdb.io/zh-cn/> |
| Netcraft | <http://toolbar.netcraft.com/site_report?url=www.wulaoban.top> |
| ViewDNS | <http://viewdns.info/> |
| IPIP CDN查询 | <https://tools.ipip.net/cdn.php> |
| SecurityTrails | <https://securitytrails.com/domain/wulaoban.top/dns> |

### 2.8 方法八：子域名法

> 使用 CDN 需额外成本，不可能所有子域名都配置 CDN，总有子域名直接指向源站。源站 IP 和使用 CDN 的网站大概率在同一网段（同一 C 段或 B 段）。

> ⚠️ **总结：绕过 CDN 需要碰运气，不是 100% 绕过的。**

---

## 三、收集旁站和 C 段 IP

### 3.1 旁站

> **旁站**指同一服务器（同 IP）下的不同站点

**价值：**
- 🎯 **扩大攻击面** — 入侵旁站后可能获取目标网站权限
- 🔍 **发现隐藏信息** — 备份文件、配置信息（nginx.conf、MySQL 备份等）

**查询工具：**
- <https://www.webscan.cc/>
- <https://chapangzhan.com/>
- vstart50 → tools → IISPutScanner

### 3.2 C 段

> **C 段**：如 `127.127.127.4` 所在的 `127.127.127.1 ~ 127.127.127.255` 范围。如果目标站安全但同 C 段其他服务器有漏洞，可通过渗透跳板获取目标权限。

**价值：**
- 📡 **发现同网段设备** — 服务器、路由器、交换机
- 🚪 **扩大攻击面** — 以其他设备为跳板渗透目标网络
- 🕵️ **发现隐藏服务** — 非默认端口上开放的隐藏服务

---

## 四、常用端口速查

| 端口 | 协议 / 服务 | 说明 |
|------|-------------|------|
| 20 / 21 | FTP | 文件传输协议 |
| 22 | SSH / SFTP | 安全远程登录与文件传输 |
| 23 | Telnet | 远程主机管理（交换机、路由器常用） |
| 25 | SMTP | 发邮件 |
| 53 | DNS | 域名解析 |
| 80 | HTTP | Web 服务 |
| 110 | POP3 | 收邮件 |
| 139 / 445 | SMB | Windows 文件共享 |
| 443 | HTTPS | 加密 Web 服务 |
| 1433 | MSSQL | 微软数据库 |
| 1521 | Oracle | Oracle 数据库 |
| 3306 | MySQL / MariaDB | 数据库 |
| 5432 | PostgreSQL | 数据库 |
| 6379 | Redis | 非关系型数据库，可反弹 Shell |
| 8080 | Tomcat / JBoss | Web 应用服务器 |
| 7001 | WebLogic | Web 应用服务器 |
| 27017 | MongoDB | 非关系型数据库 |
| 3389 | RDP | Windows 远程桌面（内网穿透常用） |
| 5900 | VNC | 远程控制工具 |

---

## 五、收集端口和服务 — Nmap

> **Nmap（Network Mapper）** 是最强大的开源网络扫描工具，用于发现主机和服务、创建网络「映射」。支持多种扫描方式和脚本引擎。

- 🏠 官网：<https://nmap.org/>
- 📖 功能介绍：<http://www.cnblogs.com/c4isr/archive/2012/12/07/2807491.html>

**核心功能：**
- 🖥️ **主机发现** — 识别网络上的存活主机
- 🔓 **端口扫描** — 枚举目标开放端口
- 📋 **版本检测** — 确定应用名称和版本号
- 💿 **OS 检测** — 确定操作系统和硬件特性
- 📜 **脚本交互** — NSE + Lua 编程
- 🐛 **漏洞检测** — 内置漏洞扫描脚本

**语法：** `nmap <扫描选项> <扫描目标>`

---

### 5.1 主机发现

> 原理类似 Ping，但手段更丰富 — 发送 ICMP / TCP / UDP / SCTP 等多种探测包

#### 常用参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `-sL` | 列表扫描，仅列举目标 IP，不进行主机发现 | `nmap -sL 192.168.1.0/24` |
| `-sn` | 只进行主机发现，不进行端口扫描 | `nmap -sn 192.168.1.0/24` |
| `-Pn` | 跳过主机发现，将所有目标视为在线 | `nmap -Pn 192.168.1.1` |
| `-PS` | TCP SYN 探测（半开扫描，不易被记录） | `nmap -PS21,22,80,443 -sn 192.168.1.0/24` |
| `-PA` | TCP ACK 探测（可穿透简单防火墙） | `nmap -PA80 -sn 192.168.1.0/24` |
| `-PU` | UDP 探测（回复 ICMP port unreachable 则在线） | `nmap -PU53 -sn 192.168.1.0/24` |
| `-PE` | ICMP Echo（普通 Ping） | `nmap -PE -sn 192.168.1.0/24` |
| `-PP` | ICMP Timestamp（可绕过禁 Ping） | `nmap -PP -sn 192.168.1.0/24` |
| `-PM` | ICMP Netmask 子网掩码探测 | `nmap -PM -sn 192.168.1.0/24` |
| `-PO` | IP 协议包探测（适用于极严格防火墙） | `nmap -PO1,2,6 -sn 192.168.1.1` |
| `-n` | 不进行 DNS 解析（加速扫描） | `nmap -sn -n 192.168.1.0/24` |
| `--traceroute` | 追踪路由节点 | `nmap -sn --traceroute 192.168.1.1` |
| `--dns-servers` | 指定 DNS 服务器 | `nmap --dns-servers 8.8.8.8,1.1.1.1 baidu.com` |

---

### 5.2 端口扫描

> Nmap 最核心的功能，默认扫描 1000 个最可能开放的 TCP 端口

**端口状态分类：**

| 状态 | 含义 |
|------|------|
| `open` | 端口开放 |
| `closed` | 端口关闭 |
| `filtered` | 被防火墙/IDS 屏蔽 |
| `unfiltered` | 未被屏蔽，但开放状态需进一步确定 |
| `open\|filtered` | 开放或被屏蔽 |
| `closed\|filtered` | 关闭或被屏蔽 |

**扫描方式分类：**

| 类型 | 特点 | 代表 |
|------|------|------|
| 🔓 **开放扫描** | 可靠性高，但易被日志记录 | TCP Connect (`-sT`) |
| 🕵️ **隐蔽扫描** | 避免 IDS 检测，但数据包可能被丢弃 | TCP FIN (`-sF`) |
| ⚡ **半开放扫描** | 隐蔽性与可靠性兼顾 | TCP SYN (`-sS`) |

#### 扫描方式详解

| 参数 | 方式 | 原理 | 示例 |
|------|------|------|------|
| ⭐ `-sS` | TCP SYN 半开扫描 | 发 SYN 包，收到 SYN+ACK 则开放，不建完整连接 | `nmap -sS 192.168.1.1` |
| `-sT` | TCP Connect 全连接 | 调用系统 connect() 完成三次握手 | `nmap -sT 192.168.1.1` |
| `-sA` | TCP ACK 扫描 | 发纯 ACK 包，判断端口是否被防火墙过滤 | `nmap -sA 192.168.1.1` |
| `-sW` | TCP 窗口扫描 | 基于 ACK 包，通过窗口大小判断端口状态 | `nmap -sW 192.168.1.1` |
| `-sM` | Maimon 扫描 | 发送 FIN+ACK 包 | `nmap -sM 192.168.1.1` |
| ⭐ `-sU` | UDP 端口扫描 | 适用于 DNS、SNMP、DHCP 等 UDP 服务 | `nmap -sU -p 53,161 192.168.1.1` |
| `-sN` | TCP Null 秘密扫描 | 不带任何标志位，对 Windows 无效 | `nmap -sN 192.168.1.1` |
| ⭐ `-sF` | TCP FIN 秘密扫描 | 仅设置 FIN 标志位，绕过简单 IDS | `nmap -sF 192.168.1.1` |
| `-sX` | TCP Xmas 圣诞树扫描 | 设置 FIN+URG+PSH 三标志位 | `nmap -sX 192.168.1.1` |
| `--scanflags` | 自定义 TCP 标志位 | 手动指定标志位组合 | `nmap --scanflags SYNFIN 192.168.1.1` |
| `-sI` | 空闲扫描（僵尸扫描） | 利用第三方僵尸主机，极度隐蔽 | `nmap -sI 192.168.1.100 192.168.1.1` |
| `-sY` | SCTP INIT 扫描 | 探测 SCTP 协议端口（电信/5G 设备） | `nmap -sY 192.168.1.1` |
| `-sZ` | SCTP COOKIE-ECHO | 基于 SCTP COOKIE 机制 | `nmap -sZ 192.168.1.1` |
| `-sO` | IP 协议扫描 | 探测支持的 IP 协议类型 | `nmap -sO 192.168.1.1` |
| `-b` | FTP 反弹扫描 | 利用旧版 FTP 漏洞代理扫描（已基本失效） | `nmap -b ftp.test.com 192.168.1.1` |

#### 其他端口参数

```bash
-p 22                # 只扫描指定端口
-p 1-65535           # 扫描全部端口
-p U:53,111,T:21-25  # 同时扫描 UDP 和 TCP 端口
-F                   # 扫描更少的端口（快速模式）
--top-ports 300      # 扫描最常见的 300 个端口
```

#### 使用演示

```bash
# 内网扫描
nmap -sS -sU -T4 --top-ports 300 192.168.0.22

# 外网扫描
nmap -sS -sU -T4 --top-ports 300 152.136.221.160
```

#### -T 时间模板

| 级别 | 名称 | 说明 |
|------|------|------|
| `-T0` | Paranoid | IDS 躲避，极慢 |
| `-T1` | Sneaky | IDS 躲避，慢 |
| `-T2` | Polite | 降低速度，减少带宽占用 |
| `-T3` | Normal | ⭐ 默认模式，无优化 |
| `-T4` | Aggressive | ⭐ 假设网络可靠，加速扫描 |
| `-T5` | Insane | 极速，牺牲准确性 |

---

### 5.3 版本探测

> 通过匹配 Banner 和探测包签名，识别具体应用名称和版本

**探测流程：**
1. 检查 open/open|filtered 端口是否在排除列表中
2. 尝试建立 TCP 连接，等待 Welcome Banner（通常 6 秒+）
3. 将 Banner 与 `nmap-services-probes` 中的签名对比
4. 若无法确定，发送更多探测包进行匹配
5. 如检测到 SSL，调用 OpenSSL 进一步侦查
6. 如检测到 SunRPC，调用 brute-force RPC grinder

| 参数 | 说明 |
|------|------|
| `-sV` | 启用版本侦测 |
| `--version-intensity <0-9>` | 侦测强度，默认 7，越高越准但越慢 |
| `--version-light` | 轻量侦测（intensity 2） |
| `--version-all` | 使用所有 probes（intensity 9） |
| `--version-trace` | 显示详细侦测过程 |

```bash
nmap -sV 192.168.111.131
```

---

### 5.4 OS 侦测

> 利用 TCP/IP 协议栈指纹识别操作系统，Nmap 内置 **2600+** 已知系统指纹（`nmap-os-db`）

| 参数 | 说明 |
|------|------|
| `-O` | 启用 OS 侦测 |
| `--osscan-limit` | 仅对确认有 open 和 closed 端口的主机探测 |
| `--osscan-guess` | 大胆猜测，降低准确性但提供更多候选 |

```bash
nmap -O 152.136.221.160
```

---

### 5.5 漏洞扫描

> Nmap 漏洞库较小，实际工作中多用专业漏洞扫描工具。以下为基本用法：

```bash
# 常见漏洞扫描
nmap 192.168.111.131 --script=auth,vuln

# 精确指定漏洞类型
nmap 192.168.111.131 --script=dns-zone-transfer,ftp-anon,http-backup-finder,http-shellshock,http-robots.txt,smb-vuln-ms17-010
```

---

### 5.6 IP 欺骗

> 伪造数据包中的源 IP 地址，隐藏真实 IP

**作用：**
- 🫥 隐藏真实 IP，避免被追踪
- 🔓 绕过 IP 白名单和访问控制策略
- 🌀 干扰目标日志与监控系统
- 🛡️ 躲避防火墙、IDS 的识别与封禁

```bash
# -D 选项：使用诱饵 IP 进行扫描
nmap -D 111.111.111.111,222.222.222.222,333.333.333.333 192.168.188.111

# RND 随机生成诱饵地址
nmap -D RND:5 192.168.188.111
```

> ⚠️ 进行版本检测或 TCP 扫描时，诱饵无效。可与真实 IP 交叉使用来欺骗管理员。

---

## 六、收集网站指纹信息

> **网站指纹**是指网站的技术架构、服务类型等独特可识别特征，如同人类指纹。

### 6.1 在线指纹识别

| 平台 | 地址 |
|------|------|
| 云悉 | <https://www.yunsee.cn/> |
| 潮汐 | <http://finger.tidesec.com/> |

### 6.2 CMS 识别

> **CMS（内容管理系统）** 是现成的建站程序，具有独特的结构命名规则，可用于识别具体软件和版本。

| 类型 | 常见 CMS |
|------|----------|
| PHP | DedeCMS、帝国 CMS、Discuz、phpWind、phpCMS |
| ASP | Zblog、KingCMS |
| .NET | EoyooCMS |
| 国外 | Joomla、WordPress、Magento、Drupal、Mambo |

### 6.3 工具

| 工具 | 说明 |
|------|------|
| **[Wappalyzer](https://www.wappalyzer.com/)** | 浏览器插件，一键分析网站技术栈（架构、语言、框架、服务器等） |
| **御剑 WEB 指纹识别** | 指纹识别工具（vstart50 内置） |

> 💡 发现 Web 应用技术版本后，可搜索对应历史漏洞进行攻击。

### 6.4 Ehole 工具

> **EHole（棱洞）** — 帮助红队从大量杂乱资产中精准定位易被攻击的系统

- 🔗 <https://github.com/EdgeSecurityTeam/Ehole>
- 支持本地识别和 FOFA API 批量识别

```bash
EHole_windows_amd64.exe finger -l 1.txt          # 指纹识别
EHole_windows_amd64.exe finger -l 1.txt -o 1.xls # 结果输出到 Excel
```

### 6.5 源码指纹

> 从网站代码中识别使用的源码，一些常用源码网站：
> - 源码之家：<https://www.mycodes.net/>
> - 站长下载：<http://down.chinaz.com/>

---

## 七、收集敏感信息

### 7.1 目录信息收集

> 运维人员可能将代码备份文件（如 `www.rar`）放在可访问目录中，通过工具自动化扫描发现

#### 工具

| 工具 | 说明 | 用法 |
|------|------|------|
| **7kbscan** | 目录扫描（vstart50 内置） | 图形界面操作 |
| **dirsearch** | Python 目录扫描工具 | `python3 dirsearch.py -u http://192.168.188.129:80` |

```bash
# dirsearch 安装依赖
pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

### 7.2 代码管理工具信息泄露

#### Git vs SVN 对比

| 特性 | **Git**（分布式） | **SVN**（集中式） |
|------|-----------------|------------------|
| 架构 | 每个开发者本地有完整仓库 | 所有开发者依赖中央服务器 |
| 分支 | 分支管理强大，支持并行开发 | 分支功能较弱 |
| 适用 | 分布式团队、大型项目、开源项目 | 传统团队、集中式开发、简单项目 |
| 国产平台 | Gitee | — |

---

#### 🔴 Git 信息泄露

> Web 项目使用 Git 同步静态文件到服务器时，若未删除 `.git` 隐藏目录，可通过其恢复全部源代码

**工具 — GitHack：**
```bash
python3 GitHack.py http://192.168.111.128/.git
# 若扫不出来，尝试子目录
python3 GitHack.py http://192.168.111.128/test/.git/
```

- 🔗 <https://github.com/lijiejie/GitHack>

---

#### 🔴 SVN 信息泄露

> SVN 发布代码时会生成 `.svn` 隐藏目录，其中 `wc.db` 文件可下载并用 Navicat 分析 `NODES` 和 `REPOSITORY` 表获取源码

**快速搭建 SVN 环境（CentOS）：**
```bash
# 安装
yum install subversion -y

# 创建仓库
cd /tmp && mkdir svn && chmod -R 777 /tmp/svn
svnadmin create /tmp/svn

# 配置（去掉注释）
cd /tmp/svn/conf
# vim svnserve.conf → anon-access=read, auth-access=write, password-db=passwd, authz-db=authz
# vim passwd → admin = admin
# vim authz → [group] admins=admin, [/] @admins=rw, *=rw

# 启动
svnserve -d -r /tmp/svn

# 创建项目并提交
mkdir test && svn checkout svn://192.168.111.128 test
cp -r /var/www/html/* /tmp/svn/test/
svn add * && svn commit -m "first blood" *
```

> ⚠️ **运维人员务必删除 `.svn` 和 `.git` 目录！**

---

#### 🔴 DS_Store 文件泄露

> Mac 下 Finder 自动生成的 `.DS_Store` 文件记录了文件夹展示方式，可能导致目录结构和源码泄露

**工具 — ds_store_exp：**
```bash
python3 ds_store_exp.py http://192.168.111.131/pikachu/.DS_Store
```

- 🔗 <https://github.com/lijiejie/ds_store_exp>

---

### 7.3 代码托管平台信息泄露

> **GitHub 是企业敏感信息泄露的重灾区**，几乎只需要「会上网、会搜索」就能挖到大量信息

**常见泄露内容：**
- 🔑 数据库账号密码（MySQL、Redis、Mongo）
- 🔑 API Key、Token、Secret
- ☁️ 阿里云 OSS / 腾讯云 COS / AWS 密钥
- 🌐 内网地址、后台管理地址
- 💻 完整源码、配置文件、测试环境账号
- 📱 短信、邮件、支付接口密钥

**泄露不止 GitHub：**

| 类型 | 平台 |
|------|------|
| 代码托管 | GitHub、GitLab、Coding、Gitee、Gitea |
| 包管理 | npm、PyPI、RubyGems |
| 网盘 | 百度网盘、蓝奏云 |
| 社交/工作 | QQ 群、企业微信、钉钉群文件 |

> 💡 **很多时候漏洞不需要「挖」，只是有人把钥匙扔在了大街上。**

**参考：**
- <https://www.sohu.com/a/251079302_328948>
- <https://www.zhihu.com/question/667213540/answer/3626556887>

---

> 📌 **总结：GitHub 信息泄露是网络安全入门最友好、最实用的技能之一 — 不需要高深漏洞技术，只要会搜，就能发现大量真实有效的敏感信息。**
