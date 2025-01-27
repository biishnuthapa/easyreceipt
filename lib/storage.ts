import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

interface StorageError {
  status?: number;
  name?: string;
  message?: string;
}

export async function uploadPDF(pdfContent: string, fileName: string): Promise<string> {
  try {
    // Remove the data URL prefix and convert to Buffer
    const base64Data = pdfContent.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create server-side Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Check authentication
    const { data: { session }, error: authError } = await (await supabase).auth.getSession();
    if (authError || !session) {
      throw new Error('Authentication required for file upload');
    }

    // Upload directly to storage bucket
    const { data, error: uploadError } = await (await supabase).storage
      .from('receipts')
      .upload(`pdfs/${fileName}`, buffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = (await supabase).storage
      .from('receipts')
      .getPublicUrl(`pdfs/${fileName}`);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    const storageError = error as StorageError;
    throw {
      statusCode: storageError.status?.toString() || '500',
      error: storageError.name || 'Internal Server Error',
      message: storageError.message || 'Failed to upload PDF'
    };
  }
}