import Image from 'next/image';
import { ONBOARDING_IMAGES } from '@/constants/images';

type ImageSections = keyof typeof ONBOARDING_IMAGES;
type ImageTypes<T extends ImageSections> = keyof typeof ONBOARDING_IMAGES[T];

interface OnboardingImageProps {
  section: ImageSections;
  image: string;
  alt: string;
  className?: string;
}

export function OnboardingImage({ section, image, alt, className = '' }: OnboardingImageProps) {
  const imagePath = ONBOARDING_IMAGES[section][image as ImageTypes<typeof section>];
  
  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <Image
        src={imagePath}
        alt={alt}
        width={1200}
        height={800}
        className="w-full h-auto"
        priority
      />
    </div>
  );
}
