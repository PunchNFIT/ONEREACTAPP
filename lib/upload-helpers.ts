import { API_BASE_URL } from "../config";

export const validateFile = (
  file: any,
  allowedTypes: string[],
  maxSize: number,
) => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const fileType = file.mimeType;

  const isAllowedType = allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return `.${fileExtension}` === type;
    } else {
      return fileType.includes(type);
    }
  });

  if (!isAllowedType) {
    return { valid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max size: ${maxSize / (1024 * 1024)} MB` };
  }

  return { valid: true, error: null };
};

export const uploadFile = async (
  url: string,
  file: any,
  additionalData: Record<string, string> = {},
) => {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as any);

  Object.keys(additionalData).forEach((key) => {
    formData.append(key, additionalData[key]);
  });

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "File upload failed");
  }

  return response.json();
};
