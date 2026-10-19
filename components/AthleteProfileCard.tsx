import Image from "next/image";
import type { ReactNode } from "react";

type AthleteProfileCardProps = {
  name: string;
  club: string;
  photoSrc: string;
  children?: ReactNode;
};

export function AthleteProfileCard({ name, club, photoSrc, children }: AthleteProfileCardProps) {
  return (
    <aside className="athlete-column" aria-label="Athlete profile">
      <div className="athlete-photo">
        <Image
          src={photoSrc}
          alt={name}
          width={340}
          height={453}
          className="athlete-photo__img"
          priority
          sizes="(max-width: 900px) 100vw, 320px"
        />
        <div className="athlete-photo__overlay">
          <p className="athlete-photo__label">Athlete</p>
          <h2 className="athlete-photo__name">{name}</h2>
          <p className="athlete-photo__club">{club}</p>
        </div>
      </div>
      {children ? <div className="athlete-column__actions">{children}</div> : null}
    </aside>
  );
}
