import React, { useMemo, useRef, useState } from "react";
import Button from "../shared/Button";
import Input from "../shared/Input";
import Steps from "../Steps";
import { toast } from "react-hot-toast";
import { useAsset, useCreateAsset } from "@livepeer/react";
import Link from "next/link";
import { useAccount } from "wagmi";
import axios from "axios";

export default function Hero() {
  // Inputs
  const [file, setFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guild.xyz
  const [guildId, setGuildId] = useState<string | null>();

  // Misc
  const { address: publicKey } = useAccount();

  // Step 2: Creating an asset
  const {
    mutate: createAsset,
    data: createdAsset,
    status: createStatus,
    progress,
  } = useCreateAsset(
    file
      ? {
          sources: [
            {
              file: file,
              name: file.name,
              playbackPolicy: {
                type: "webhook",
                webhookId: "WEBHOOK_ID",
                webhookContext: {
                  guildId,
                },
              },
            },
          ] as const,
        }
      : null
  );

  // Step 3: Getting asset and refreshing for the status
  const {
    data: asset,
    error,
    status: assetStatus,
  } = useAsset({
    assetId: createdAsset?.[0].id,
    refetchInterval: (asset) =>
      asset?.storage?.status?.phase !== "ready" ? 5000 : false,
  });

  const progressFormatted = useMemo(
    () =>
      progress?.[0].phase === "failed" || createStatus === "error"
        ? "Failed to upload video."
        : progress?.[0].phase === "waiting"
        ? "Waiting"
        : progress?.[0].phase === "uploading"
        ? `Uploading: ${Math.round(progress?.[0]?.progress * 100)}%`
        : progress?.[0].phase === "processing"
        ? `Processing: ${Math.round(progress?.[0].progress * 100)}%`
        : null,
    [progress, createStatus]
  );

  const isLoading = useMemo(
    () =>
      createStatus === "loading" ||
      assetStatus === "loading" ||
      (asset && asset?.status?.phase !== "ready") ||
      (asset?.storage && asset?.storage?.status?.phase !== "ready"),
    [asset, assetStatus, createStatus]
  );

  const handleClick = async () => {
    if (!publicKey) {
      toast("Please connect your wallet to continue", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }

    if (!file) {
      toast("Please choose a file", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }
    if (!guildId) {
      toast("Please enter the guild id", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }

    const isValidGuild = await checkGuildId();
    if (isValidGuild) {
      createAsset?.();
    } else {
      toast("Invalid Guild Id, please try again", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const checkGuildId = async () => {
    try {
      const res = await axios.get(`https://api.guild.xyz/v1/guild/${guildId}`);
      console.log(res.data);
      return res.data;
    } catch {
      return false;
    }
  };

  return (
    <section className="p-10 h-screen flex flex-col lg:flex-row-reverse">
      <div className="w-full h-1/2 lg:h-full lg:w-1/2 ">
        <div className="relative">
          <img
            src="https://cdn.midjourney.com/c4dd420f-e216-4548-a4e2-bdcfa166a7d4/0_1_640_N.webp"
            alt="BannerImage"
            className=" h-[90vh] w-full lg:object-cover lg:block hidden rounded-xl"
          />
        </div>
      </div>
      <div className="lg:w-1/2  w-full h-full lg:mr-20">
        <p className="text-base font-light text-primary lg:mt-20 mt-5">
          Livepeer x Ethereum x Guild.xyz
        </p>
        <h1 className="text-5xl font-bold font-MontHeavy text-gray-100 mt-6 leading-tight">
          Control who can watch your videos with Livepeer and Guild.xyz
        </h1>
        <p className="text-base font-light text-zinc-500 mt-2">
          Token gating is a powerful tool for content creators who want to
          monetize their video content. With Livepeer, you can easily create a
          gated video that requires users to hold a certain amount of tokens/NFT
          in order to access the content. <br /> <br /> Livepeer&apos;s token
          gating feature is easy to use and highly customizable
        </p>
        <div className="flex flex-col mt-6">
          <div className="h-4" />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-dashed border-zinc-800 border rounded-md text-zinc-700  p-4 flex items-center justify-center hover:border-zinc-700 "
          >
            <p className="">
              {file ? (
                file.name +
                " - " +
                Number(file.size / 1024 / 1024).toFixed() +
                " MB"
              ) : (
                <>Choose a video file to upload</>
              )}
            </p>
          </div>
          <div className="h-5" />
          <Input
            onChange={(e) => setGuildId(e.target.value)}
            placeholder={"Guild Id"}
          />

          <input
            onChange={(e) => {
              if (e.target.files) {
                setFile(e.target.files[0]);
              }
            }}
            type="file"
            accept="video/*"
            ref={fileInputRef}
            hidden
          />
        </div>
        <div className="flex flex-row items-center mb-20 lg:mb-0">
          <Button onClick={handleClick}>
            {isLoading ? progressFormatted || "Uploading..." : "Upload"}
          </Button>
          {asset?.status?.phase === "ready" && (
            <div>
              <div className="flex flex-col justify-center items-center ml-5 font-matter">
                <p className="mt-6 text-white">
                  Your token-gated video is uploaded, and you can view it{" "}
                  <Link
                    className="text-primary"
                    target={"_blank"}
                    rel={"noreferrer"}
                    href={`/watch/${asset?.playbackId}`}
                  >
                    here
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
        <Steps publickey={publicKey} litGateParams={"asd"} completed={false} />
      </div>
    </section>
  );
}
