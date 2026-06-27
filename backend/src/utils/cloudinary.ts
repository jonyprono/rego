import { v2 as cloudinary } from 'cloudinary';

// La configuration est automatique si la variable d'environnement CLOUDINARY_URL est présente.
// Format attendu: CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

/**
 * Télécharge une image en base64 sur Cloudinary et retourne son URL sécurisée.
 * @param base64String L'image au format base64
 * @param folder Le dossier de destination sur Cloudinary
 * @returns L'URL de l'image hébergée
 */
export const uploadBase64Image = async (base64String: string, folder: string = 'rego-reports'): Promise<string> => {
  try {
    // Si la chaîne base64 ne commence pas par data:image, Cloudinary pourrait échouer, 
    // mais dans notre cas le frontend envoie toujours des images complètes (data:image/jpeg;base64,...)
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Erreur Cloudinary:', error);
    throw new Error('Erreur lors du téléchargement de l\'image sur Cloudinary');
  }
};
