USE board;

GRANT SELECT, UPDATE, DELETE, INSERT
    ON board.*
    TO 'developer'@'*';

SELECT User, Host FROM mysql.user WHERE User = 'developer';

SELECT VERSION();

-- DROP USER 'developer'@'%';