import { createServiceClient } from "./service";

export async function uploadFile(path: string, file: File | Blob, contentType: string): Promise<string> {
    if(file.size > 20*1024*1024) {
        throw new Error("File size exceeds 20MB limit")
    }
    
    const validContentTypes: string[] = ['application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png', 'image/jpeg', 'image/webp', 'text/plain']
    
        if(!validContentTypes.includes(contentType)){
        throw new Error(`Content type ${contentType} is not allowed`)
    }

    const { data, error } = await createServiceClient()
                                    .storage
                                    .from('assignment-uploads')
                                    .upload(path, file, { contentType, upsert: false })

    if(error) throw error

    return data.path
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await createServiceClient()
                            .storage
                            .from('assignment-uploads')
                            .createSignedUrl(path, expiresIn)
    
    if (error) throw error
    return data.signedUrl
}