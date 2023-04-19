import React, { useEffect, useState } from "react";
import { Nav } from "../../components";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { Player, usePlaybackInfo } from "@livepeer/react";
import axios from "axios";

interface PlaybackPolicy {
  type: string;
  webhookContext: any;
  webhookId: string;
}

export default function Watch() {
  const router = useRouter();
  const playbackId = router.query.playbackId?.toString();
  const { address } = useAccount();

  const [jwt, setJwt] = useState("");
  const [hasAccess, setHasAccess] = useState<string | boolean>("checking");

  // Step 1: Fetch playback URL
  const { data: playbackInfo, status: playbackInfoStatus } = usePlaybackInfo({
    playbackId,
  });

  const generateJwt = async (guildId: string) => {
    const { data } = await axios.post("/api/generate-jwt", {
      guildId,
    });
    if (data?.token) {
      setJwt(data?.token);
      setHasAccess(true);
    }
  };

  const checkAccess = async (playbackPolicy: any) => {
    console.log("checking", playbackPolicy);
    const guildId = playbackPolicy.webhookContext.guildId;
    const { data } = await axios.get(
      `https://api.guild.xyz/v1/guild/access/28452/${address}`
    );
    if (data.length > 0) {
      generateJwt(guildId);
    } else {
      setHasAccess(false);
    }
  };

  useEffect(() => {
    if (playbackInfo) {
      const { playbackPolicy } = playbackInfo?.meta ?? {};
      checkAccess(playbackPolicy);
    }
  }, [playbackInfo]);

  return (
    <>
      <Nav />
      <div className="flex flex-col text-lg items-center justify-center mt-40"></div>
      <div className="flex justify-center text-center font-matter">
        <div className="overflow-auto   rounded-md p-6 w-3/5 mt-20">
          {hasAccess == "checking" && (
            <p className="text-white">Checking, please wait...</p>
          )}

          {!hasAccess && (
            <p className="text-white">
              Sorry, you do not have access to this content
            </p>
          )}
          {jwt && <Player playbackId={playbackId} accessKey={jwt} />}
        </div>
      </div>
    </>
  );
}
