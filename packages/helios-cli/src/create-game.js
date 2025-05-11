const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

// Путь к шаблону
const templatePath = path.resolve(__dirname, 'game-template');

// Путь к новой директории проекта
const newProjectPath = path.resolve(__dirname, 'new-game');

// Функция для копирования файлов из шаблона в новый проект
function copyTemplate() {
    // Копируем содержимое шаблона в новую директорию
    fs.rmSync(newProjectPath, { recursive: true, force: true });
    fs.mkdirSync(newProjectPath);

    const files = fs.readdirSync(templatePath);
    files.forEach(file => {
        const currentFile = path.join(templatePath, file);
        const destination = path.join(newProjectPath, file);
        if (fs.statSync(currentFile).isDirectory()) {
            fs.mkdirSync(destination, { recursive: true });
            copyDirectory(currentFile, destination);
        } else {
            fs.copyFileSync(currentFile, destination);
        }
    });
}

// Функция для копирования директории
function copyDirectory(source, destination) {
    const files = fs.readdirSync(source);
    files.forEach(file => {
        const currentFile = path.join(source, file);
        const destinationFile = path.join(destination, file);
        if (fs.statSync(currentFile).isDirectory()) {
            fs.mkdirSync(destinationFile, { recursive: true });
            copyDirectory(currentFile, destinationFile);
        } else {
            fs.copyFileSync(currentFile, destinationFile);
        }
    });
}

// Функция для установки зависимостей
function installDependencies() {
    execSync('pnpm install', { cwd: newProjectPath, stdio: 'inherit' });
}

// Основная функция
function createGame() {
    console.log('Создание нового проекта...');
    copyTemplate();
    installDependencies();
    console.log('Проект создан успешно!');
}

createGame();
