// imageKitService.js (Revised)
import ImageKit from "imagekit";

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const deleteImage = async (fileId) => {
    if (!fileId) {
        console.warn("No fileId provided for deletion.");
        return;
    }
    try {
        console.log(`Deleting image with fileId: ${fileId}`); // Log the fileId
        await imagekit.deleteFile(fileId);
        console.log(`Image with fileId ${fileId} deleted successfully.`); // Log success
    } catch (error) {
        console.error("Error deleting image:", error); // Log the error
        throw error; // Re-throw the error to bubble it up
    }
};

export const uploadImage = async (file, userName, referralCode) => {
    try {
        const timestamp = Date.now();
        const customFileName = `${userName}_${referralCode}_${timestamp}.${file.name.split('.').pop()}`;

        const response = await imagekit.upload({
            file: file,
            fileName: customFileName,
            useUniqueFileName: false,
            folder: 'Credit_Bank_Campaign_User_Photos',
            options: {
                transformation: [
                    {
                        width: 800,
                        height: 600,
                        quality: 80
                    }
                ]
            }
        });

        const fileUrl = response.url;
        const fileId = response.fileId;

        return { fileUrl, fileId };
    } catch (error) {
        console.error("Image upload failed:", error);
        throw error;
    }
};

export const listFilesInFolder = async (folder = '/StrategicDocs') => {
    try {
        const result = await imagekit.listFiles({
            path: folder,
            limit: 100,
            skip: 0,
        });
        return result;
    } catch (error) {
        console.error('Error listing files from ImageKit:', error);
        throw error;
    }
};

export const listSubfoldersInFolder = async (folder = '/TrainingMaterials') => {
    try {
        const result = await imagekit.listFiles({
            path: folder,
            limit: 100,
            skip: 0,
            type: 'folder',
        });
        // Only return unique folder names
        const folders = Array.from(new Set(result
            .filter(f => f.type === 'folder')
            .map(f => f.name)));
        return folders;
    } catch (error) {
        console.error('Error listing subfolders from ImageKit:', error);
        throw error;
    }
};

export const listAllFilesRecursively = async (folder = '/TrainingMaterials') => {
    let allFiles = [];
    let skip = 0;
    const limit = 100;
    let hasMore = true;
    try {
        while (hasMore) {
            const files = await imagekit.listFiles({
                path: folder,
                limit,
                skip,
            });
            // Add files (not folders)
            allFiles = allFiles.concat(files.filter(f => f.type === 'file'));
            // Find subfolders
            const subfolders = files.filter(f => f.type === 'folder');
            for (const sub of subfolders) {
                const subFiles = await listAllFilesRecursively(`${folder}/${sub.name}`);
                allFiles = allFiles.concat(subFiles);
            }
            hasMore = files.length === limit;
            skip += limit;
        }
    } catch (error) {
        console.error('Error recursively listing files from ImageKit:', error);
        throw error;
    }
    return allFiles;
};

export const listAllFilesByPrefix = async (folder = '/TrainingMaterials') => {
    let allFiles = [];
    let skip = 0;
    const limit = 100;
    let hasMore = true;
    try {
        while (hasMore) {
            const files = await imagekit.listFiles({
                limit,
                skip,
            });
            // Only include files in the desired folder or its subfolders
            allFiles = allFiles.concat(
                files.filter(f =>
                    f.type === 'file' &&
                    f.folder &&
                    (f.folder === folder || f.folder.startsWith(folder + '/'))
                )
            );
            hasMore = files.length === limit;
            skip += limit;
        }
    } catch (error) {
        console.error('Error listing files by prefix from ImageKit:', error);
        throw error;
    }
    return allFiles;
};

export { imagekit }; // Only export imagekit here
