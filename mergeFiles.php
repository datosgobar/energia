<?php

echo "<pre>";

$out = fopen("public/source/prueba/out.csv", "w+");
$contenido = "";

$contenido = file_get_contents("public/source/prueba/1 (1).csv", "a+");

for ($i = 2; $i <= 33; $i++) {
  $file = file_get_contents("public/source/prueba/1 (" . $i . ").csv", "a+");
  $file = explode("\n", $file);
  array_shift($file);
  $file = implode("\n", $file);
  $contenido = $contenido . "\n" . $file;
}

fwrite($out, $contenido);

?>
