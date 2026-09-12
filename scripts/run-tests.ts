import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const TESTS_DIR = join(process.cwd(), "src", "tests");

async function runTest(file: string): Promise<boolean> {
    return new Promise((resolve) => {
        const process = spawn(
            "npx",
            ["tsx", join(TESTS_DIR, file)],
            {
                stdio: "inherit",
                shell: true,
            }
        );

        process.on("close", (code) => {
            resolve(code === 0);
        });
    });
}

async function main(): Promise<void> {
    const files = (await readdir(TESTS_DIR))
        .filter((file) => file.endsWith(".ts"))
        .sort();

    if (files.length === 0) {
        console.log("Nenhum teste encontrado.");
        return;
    }

    const results: { file: string; passed: boolean }[] = [];

    for (const file of files) {
        console.log(`\nExecutando ${file}`);
        console.log("--------------------------------");

        const passed = await runTest(file);

        results.push({
            file,
            passed,
        });
    }

    console.log("\n================================");
    console.log("Resultado dos testes");
    console.log("================================");

    for (const result of results) {
        console.log(
            `${result.passed ? "PASS" : "FAIL"} - ${result.file}`
        );
    }

    const failedTests = results.filter(
        (result) => !result.passed
    );

    console.log("\n--------------------------------");

    if (failedTests.length > 0) {
        console.log(
            `${failedTests.length} teste(s) falharam.`
        );
        process.exitCode = 1;
    } else {
        console.log("Todos os testes passaram.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});