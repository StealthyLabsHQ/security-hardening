<?php
// Intentionally vulnerable PHP snippets for secure-review smoke tests.
// Do not copy into production.

function getUser($db, $id) {
    $sql = "SELECT * FROM users WHERE id = " . $id;
    return mysqli_query($db, $sql);
}

function getUserInterp($db, $id) {
    return $db->query("SELECT * FROM users WHERE id = $id");
}

function runEval($code) {
    return eval($code);
}
