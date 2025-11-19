// src/lib/fileUtils.ts

/**
 * Утилиты для работы с файлами
 */

/**
 * Получить расширение файла из пути
 */
export function getFileExtension(filePath: string): string {
  return filePath.split('.').pop()?.toLowerCase() || '';
}

/**
 * Получить имя файла из пути
 */
export function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath;
}

/**
 * Проверить, является ли файл изображением
 */
export function isImageFile(filePath: string): boolean {
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico'];
  return imageExtensions.includes(getFileExtension(filePath));
}

/**
 * Проверить, является ли файл PDF
 */
export function isPdfFile(filePath: string): boolean {
  return getFileExtension(filePath) === 'pdf';
}

/**
 * Проверить, является ли файл видео
 */
export function isVideoFile(filePath: string): boolean {
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
  return videoExtensions.includes(getFileExtension(filePath));
}

/**
 * Проверить, является ли файл аудио
 */
export function isAudioFile(filePath: string): boolean {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
  return audioExtensions.includes(getFileExtension(filePath));
}

/**
 * Проверить, является ли файл Office документом
 */
export function isOfficeFile(filePath: string): boolean {
  const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  return officeExtensions.includes(getFileExtension(filePath));
}

/**
 * Проверить, является ли файл текстовым
 */
export function isTextFile(filePath: string): boolean {
  const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'log'];
  return textExtensions.includes(getFileExtension(filePath));
}

/**
 * Проверить, является ли файл кодом
 */
export function isCodeFile(filePath: string): boolean {
  const codeExtensions = [
    'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 
    'php', 'html', 'css', 'scss', 'sass', 'less', 'go', 'rs', 'rb'
  ];
  return codeExtensions.includes(getFileExtension(filePath));
}

/**
 * Получить категорию файла
 */
export function getFileCategory(filePath: string): string {
  if (isImageFile(filePath)) return 'image';
  if (isPdfFile(filePath)) return 'pdf';
  if (isVideoFile(filePath)) return 'video';
  if (isAudioFile(filePath)) return 'audio';
  if (isOfficeFile(filePath)) return 'office';
  if (isTextFile(filePath)) return 'text';
  if (isCodeFile(filePath)) return 'code';
  return 'other';
}

/**
 * Форматировать размер файла в читаемый формат
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Получить MIME тип файла по расширению
 */
export function getMimeType(filePath: string): string {
  const extension = getFileExtension(filePath);
  
  const mimeTypes: Record<string, string> = {
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    
    // Text
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    xml: 'application/xml',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Проверить, можно ли предварительно просмотреть файл в браузере
 */
export function canPreviewInBrowser(filePath: string): boolean {
  const category = getFileCategory(filePath);
  return ['image', 'pdf', 'video', 'audio', 'text', 'code'].includes(category);
}

/**
 * Получить URL для Office Online Viewer
 */
export function getOfficeViewerUrl(filePath: string): string {
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(filePath)}`;
}

/**
 * Получить цвет для типа файла (для UI)
 */
export function getFileTypeColor(filePath: string): string {
  const category = getFileCategory(filePath);
  
  const colors: Record<string, string> = {
    image: 'text-blue-500',
    pdf: 'text-red-500',
    video: 'text-purple-500',
    audio: 'text-green-500',
    office: 'text-orange-500',
    text: 'text-gray-500',
    code: 'text-yellow-500',
    other: 'text-gray-400',
  };
  
  return colors[category] || colors.other;
}

/**
 * Создать безопасный URL для скачивания
 */
export function createDownloadUrl(filePath: string, fileName?: string): string {
  const url = new URL(filePath);
  if (fileName) {
    url.searchParams.set('download', fileName);
  }
  return url.toString();
}
