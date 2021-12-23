#!/usr/bin/env node
import React, { useEffect, useState } from "react";
import { Newline, render, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import QuartzClient from ".";
import Table from "ink-table";

const pushingToGuild = () => {
  if (
    process.argv[2] &&
    (process.argv[2] === "push" || process.argv[2] === "clear") &&
    process.argv[3]
  )
    return process.argv[3];
  else if (
    process.argv[1] &&
    (process.argv[1] === "push" || process.argv[1] === "clear") &&
    process.argv[2]
  )
    return process.argv[2];
  return undefined;
};
const Push = ({ client }: { client: QuartzClient }) => {
  const { exit } = useApp();
  const guild = pushingToGuild();
  const commands = client.generateCommands();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  useEffect(() => {
    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        if (guild) await client.overwriteGuildCommands(guild);
        else await client.overwriteCommands();
        setSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        exit();
      } catch (e) {
        setError(e as Error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        exit();
      }
    })();
  }, []);
  return (
    <>
      <Table
        data={commands.map((command) => ({
          name: command.name,
          options: command.options?.length ?? 0,
          type: command.type,
        }))}
      />
      <Newline />
      <Text>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        {` Pushing commands to ${guild ? `GuildID: ${guild}` : "Discord"}`}
      </Text>
      {success && (
        <>
          <Newline />
          <Text color="green">
            Succesfully pushed to Discord, this can take up to an hour to
            show...
          </Text>
        </>
      )}
      {error && (
        <>
          <Newline />
          <Text color="red">
            {error.name}: {error.message}
          </Text>
        </>
      )}
    </>
  );
};

const Clear = ({ client }: { client: QuartzClient }) => {
  const { exit } = useApp();
  const guild = pushingToGuild();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  useEffect(() => {
    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        if (guild) await client.clearGuildCommands(guild);
        else await client.clearCommands();
        setSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        exit();
      } catch (e) {
        setError(e as Error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        exit();
      }
    })();
  }, []);
  return (
    <>
      <Text>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        {` Clear commands from ${guild ? `GuildID: ${guild}` : "Discord"}`}
      </Text>
      {success && (
        <>
          <Newline />
          <Text color="green">
            Succesfully cleared from Discord, this can take up to an hour to
            show...
          </Text>
        </>
      )}
      {error && (
        <>
          <Newline />
          <Text color="red">
            {error.name}: {error.message}
          </Text>
        </>
      )}
    </>
  );
};

export const loadPush = (client: QuartzClient) =>
  render(<Push client={client} />);
export const loadClear = (client: QuartzClient) =>
  render(<Clear client={client} />);
