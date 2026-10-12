import { environment } from '../../environments/environment';

export function poleImageUrl(imageId: string | null | undefined): string {
  return imageId ? `${environment.imageBaseUrl}/${imageId}.jpg` : '';
}
