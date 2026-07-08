#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const fs = require('fs');

// Color helpers
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m'; // No Color

const PROD_DB_URL = "postgresql://hq_admin:ibKwZOvGIiPAlYkcHDxecpCqX9YuV0WX@dpg-d70dd2fdiees73ditg10-a.oregon-postgres.render.com/projectmanagement_db_mwsn";
const LOCAL_DB_URL = "postgresql://postgres:postgres123@localhost:5432/projectmanagement_db_local?sslmode=disable";
const LOCAL_ADMIN_URL = "postgresql://postgres:postgres123@localhost:5432/postgres?sslmode=disable";
const LOCAL_DB_NAME = "projectmanagement_db_local";
const DUMP_FILE = "production_backup.dump";

function printHeader() {
    console.log(`${CYAN}===================================================================${NC}`);
    console.log(`${CYAN}            POSTGRESQL PRODUCTION -> LOCAL SYNC (NODE.JS)           ${NC}`);
    console.log(`${CYAN}===================================================================${NC}`);
}

function printSuccess(msg) {
    console.log(`${GREEN}[SUCCESS] ${msg}${NC}`);
}

function printInfo(msg) {
    console.log(`${BLUE}[INFO] ${msg}${NC}`);
}

function printWarning(msg) {
    console.log(`${YELLOW}[WARNING] ${msg}${NC}`);
}

function printError(msg) {
    console.error(`${RED}[ERROR] ${msg}${NC}`);
}

function checkCommands() {
    const commands = ['pg_dump', 'pg_restore', 'psql'];
    for (const cmd of commands) {
        try {
            execSync(`which ${cmd}`, { stdio: 'ignore' });
        } catch (e) {
            printError(`Command '${cmd}' is not installed or not in PATH. Please install PostgreSQL client tools.`);
            process.exit(1);
        }
    }
}

function cleanLocalDb() {
    printInfo(`Preparing local database '${LOCAL_DB_NAME}'...`);

    // Terminate active connections
    printInfo("Terminating active connections to local database...");
    const termQuery = `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${LOCAL_DB_NAME}' AND pid <> pg_backend_pid();`;
    try {
        execSync(`psql -d "${LOCAL_ADMIN_URL}" -c "${termQuery}"`, { stdio: 'ignore' });
    } catch (e) {
        // Ignore errors terminating connections (e.g. database does not exist yet)
    }

    // Drop database
    printInfo("Dropping local database if it exists...");
    try {
        execSync(`psql -d "${LOCAL_ADMIN_URL}" -c "DROP DATABASE IF EXISTS ${LOCAL_DB_NAME};"`, { stdio: 'ignore' });
    } catch (e) {
        printError(`Failed to drop database: ${e.message}`);
        process.exit(1);
    }

    // Recreate database
    printInfo(`Recreating database '${LOCAL_DB_NAME}'...`);
    try {
        execSync(`psql -d "${LOCAL_ADMIN_URL}" -c "CREATE DATABASE ${LOCAL_DB_NAME};"`, { stdio: 'ignore' });
    } catch (e) {
        printError(`Failed to create database: ${e.message}`);
        process.exit(1);
    }

    printSuccess("Local database prepared successfully.");
}

function runDump() {
    printInfo(`Dumping production database to '${DUMP_FILE}'...`);
    try {
        // We use spawnSync with inherit to show real progress
        const res = spawnSync('pg_dump', ['--no-owner', '--no-privileges', '-Fc', '-d', PROD_DB_URL, '-f', DUMP_FILE], { stdio: 'inherit' });
        if (res.status !== 0) {
            throw new Error(`pg_dump exited with code ${res.status}`);
        }
        printSuccess(`Production dump complete. Saved to '${DUMP_FILE}'.`);
    } catch (e) {
        printError(`Failed to dump production database: ${e.message}`);
        process.exit(1);
    }
}

function runRestore() {
    printInfo(`Restoring data to local database from '${DUMP_FILE}'...`);
    try {
        const res = spawnSync('pg_restore', ['--no-owner', '--no-privileges', '--no-comments', '-d', LOCAL_DB_URL, DUMP_FILE], { stdio: 'inherit' });
        if (res.status === 0) {
            printSuccess("Database restored successfully with no errors!");
        } else if (res.status === 1) {
            printWarning("Database restored with warnings. This is normal when restoring schemas/extensions. You can check the logs above.");
        } else {
            throw new Error(`pg_restore exited with code ${res.status}`);
        }
    } catch (e) {
        printError(`Failed to restore database: ${e.message}`);
        process.exit(1);
    }
}

async function main() {
    printHeader();
    checkCommands();

    const rl = readline.createInterface({ input, output });

    console.log("\nChoose synchronization mode:");
    console.log(`  ${GREEN}1)${NC} Live Sync: Dump production database and restore to local (Fresh Data)`);
    console.log(`  ${GREEN}2)${NC} Offline Sync: Use existing local backup file (${DUMP_FILE}) and restore to local`);
    console.log(`  ${GREEN}3)${NC} Live Backup Only: Dump production database to file without restoring`);
    console.log(`  ${GREEN}4)${NC} Exit`);

    const choice = await rl.question('\nEnter choice [1-4]: ');
    rl.close();

    switch (choice.trim()) {
        case '1':
            printInfo("Starting Live Sync...");
            runDump();
            cleanLocalDb();
            runRestore();
            break;
        case '2':
            printInfo("Starting Offline Sync...");
            if (!fs.existsSync(DUMP_FILE)) {
                printError(`Backup file '${DUMP_FILE}' not found in the current directory.`);
                process.exit(1);
            }
            cleanLocalDb();
            runRestore();
            break;
        case '3':
            printInfo("Starting Live Backup...");
            runDump();
            break;
        case '4':
            printInfo("Exiting.");
            process.exit(0);
        default:
            printError("Invalid option selected.");
            process.exit(1);
    }

    console.log(`\n${GREEN}===================================================================${NC}`);
    console.log(`${GREEN}                        PROCESS COMPLETED                          ${NC}`);
    console.log(`${GREEN}===================================================================${NC}`);
}

main().catch(err => {
    printError(`An unexpected error occurred: ${err.message}`);
    process.exit(1);
});