import logoImg from "@/assets/logo.png";

export default function SpinningLogo3D({ size = 64, onClick }: { size?: number; onClick?: () => void }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        cursor: onClick ? "pointer" : "default",
        perspective: "200px",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      data-testid="logo-login"
    >
      <img
        src={logoImg}
        alt="H+ Analytics"
        className="w-full h-full object-contain"
        style={{
          animation: "spinLogo3D 6s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes spinLogo3D {
          0%   { transform: rotateY(0deg)   rotateX(0deg)   rotateZ(0deg); }
          25%  { transform: rotateY(20deg)  rotateX(9deg)   rotateZ(2deg); }
          50%  { transform: rotateY(0deg)   rotateX(0deg)   rotateZ(0deg); }
          75%  { transform: rotateY(-20deg) rotateX(-9deg)  rotateZ(-2deg); }
          100% { transform: rotateY(0deg)   rotateX(0deg)   rotateZ(0deg); }
        }
      `}</style>
    </div>
  );
}
