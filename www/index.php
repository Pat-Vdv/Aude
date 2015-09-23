<!DOCTYPE html>
<html>
   <head>
      <meta charset="utf-8" />
      <title>Aude: AUtomata DEmistifier</title>
      <link rel="stylesheet" href="style.css" />
   </head>
   <body>
      <h1> Aude <span class="dash">—</span> <span class="def"><strong>Au</strong>tomata <strong>de</strong>mystifier</span></h1>
      <p id="wip">Site under construction</p>
      <ul id="menu">
         <li><a href=".">Main Page</a></li>
         <li><a href="?p=features">Features &amp; Screenshots</a></li>
         <li><a href="?p=use">Use &amp; Download</a></li>
         <li><a href="?p=about">About</a></li>
      </ul>
      <div id="content">
<?php
   if(isset($_GET['p'])) {
      if(preg_match('/[a-z]+/', $_GET['p']) && is_file($p = 'contents/' . $_GET['p'] . '.php') && $p !== 'contents/index.php') {
         include($p);
      }
      else {
         ?><p> Sorry, this page does not exist. </p><?php
      }
   }
   else {
      include('contents/index.php');
   }
?>
      <div id="credits">
         <div id="credits-logo">
            <a href="http://www.ujf-grenoble.fr/"><img alt="UJF" src="logos/ujf.jpg" /></a>
            <a href="http://www.liglab.fr/"><img alt="LIG" src="logos/lig.jpg" /></a>
            <a href="http://www-verimag.imag.fr/"><img alt="Verimag" src="logos/verimag.png" /></a>
         </div>
      </div>
   </body>
</html>
