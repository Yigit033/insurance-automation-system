import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import { Buffer } from 'buffer';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, mimeType } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');
    
    // Process image with Sharp
    const processedBuffer = await sharp(buffer)
      .grayscale()
      .normalise()
      .modulate({
        brightness: 1,
        saturation: 0,
        hue: 0
      })
      .linear(1.1, -(128 * 0.1))
      .toBuffer();

    // Convert back to base64
    const processedImage = `data:${mimeType};base64,${processedBuffer.toString('base64')}`;

    res.status(200).json({
      success: true,
      processedImage,
      buffer: processedBuffer.toString('base64')
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
