import { Lottie, type LottieAnimationData } from "@remotion/lottie";
import { useEffect, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";
import { assetBaseName, hasStaticFile } from "../lib/assets";
import { Icon, isIconName } from "./Icon";

// Plays a Lottie file from public/ when it exists. Until it is added, shows the
// built-in icon whose name matches the file name ("lottie/fuel.json" -> fuel).
export const LottieIcon: React.FC<{
  src: string;
  size: number;
  color: string;
}> = ({ src, size, color }) => {
  const exists = hasStaticFile(src);
  const [animationData, setAnimationData] =
    useState<LottieAnimationData | null>(null);
  const [handle] = useState(() =>
    exists ? delayRender(`Loading Lottie ${src}`) : null,
  );

  useEffect(() => {
    if (handle === null) {
      return;
    }
    fetch(staticFile(src))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ${src}: HTTP ${res.status}`);
        }
        return res.json() as Promise<LottieAnimationData>;
      })
      .then((json) => {
        setAnimationData(json);
        continueRender(handle);
      })
      .catch((err: unknown) => cancelRender(err));
  }, [handle, src]);

  if (exists) {
    return animationData ? (
      <Lottie
        animationData={animationData}
        loop
        style={{ width: size, height: size }}
      />
    ) : null;
  }

  const name = assetBaseName(src);
  return (
    <Icon name={isIconName(name) ? name : "wrench"} size={size} color={color} />
  );
};
