interface Props {
  pct: number;
}

export default function IlanRider({ pct }: Props) {
  return (
    <div
      className="absolute bottom-full pointer-events-none z-10"
      style={{ left: `clamp(0px, calc(${pct}% - 20px), calc(100% - 40px))` }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          backgroundImage: 'url(/IMG_6007.png)',
          backgroundSize: '400% 200%',
          backgroundPosition: '0% 0%',
          backgroundRepeat: 'no-repeat',
          animation: 'ilan-ride 0.6s steps(4) infinite',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
