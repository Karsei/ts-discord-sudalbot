CREATE TABLE g_version (
    `seqno` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `lang` CHAR(2) NOT NULL,
    `version` DECIMAL(4,2) UNSIGNED NOT NULL,
    PRIMARY KEY(seqno)
);

CREATE TABLE g_item (
    `seqno` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `version_seqno` INT(10) UNSIGNED NOT NULL,
    `idx` INT(10) UNSIGNED NOT NULL,
    `name` VARCHAR(512) NOT NULL,
    `content` LONGTEXT,
    PRIMARY KEY(`seqno`),
    FOREIGN KEY (`version_seqno`) REFERENCES `g_version`(`seqno`)
);

CREATE TABLE g_itemuicategories (
    `seqno` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `version_seqno` INT(10) UNSIGNED NOT NULL,
    `idx` INT(10) UNSIGNED NOT NULL,
    `name` VARCHAR(512) NOT NULL,
    `content` LONGTEXT,
    PRIMARY KEY(`seqno`),
    FOREIGN KEY (`version_seqno`) REFERENCES `g_version`(`seqno`)
);