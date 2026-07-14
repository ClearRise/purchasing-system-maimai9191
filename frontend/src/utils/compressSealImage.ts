const MAX_SEAL_DIMENSION = 240;
const MAX_SEAL_FILE_BYTES = 5 * 1024 * 1024;

export async function compressSealImage(file: File): Promise<string> {
  if (file.size > MAX_SEAL_FILE_BYTES) {
    throw new Error('印鑑画像は5MB以下にしてください');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(MAX_SEAL_DIMENSION / img.width, MAX_SEAL_DIMENSION / img.height, 1);
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('画像の処理に失敗しました');

    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = src;
  });
}
