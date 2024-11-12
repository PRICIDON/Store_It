import React from "react";
import { Models } from "node-appwrite";

const Card = ({ file }: { file: Models.Document }) => {
  return <h1 className="h1">{file.name}</h1>;
};
export default Card;
