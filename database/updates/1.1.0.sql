ALTER TABLE player ADD COLUMN identifier VARCHAR(32) DEFAULT NULL;

UPDATE player SET identifier = (hex(randomblob(32))) WHERE identifier IS NULL;