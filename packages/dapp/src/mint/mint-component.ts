import { inject, LogManager } from "aurelia-framework";
import { Logger } from "aurelia-logging";
import "./mint-component.scss";
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import geoJson0 from './geojson0.json';

@inject(Element)
export class MintComponent {
  options = {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
  
    auth: process.env.PROJECT_ID + ':' + process.env.PROJECT_SECRET,
  };
  ipfsClient = create(this.options);

  private name = "Food Forest 1";
  private description = "food forest in Curaçao";
  private geojson = geoJson0;
  private fileurl = "";

  private logger: Logger = LogManager.getLogger("components.mint");

  clearInputs() {
    this.name = "";
    this.description = "";
    this.geojson = geoJson0;
    this.fileurl = "";
  }

  uploadImage() {
    console.log("yo");
  //   const file = e.target.files[0];
  //   if (ipfsClient == null) {
  //     throw new Error("IPFS client is not initialized");
  //   }
  //   try {
  //     const added = await ipfsClient.add(file, {
  //       progress: (prog: any) => console.log(`received: ${prog}`),
  //     });
  //     console.log(added);
  //     console.log(added.path);
  //     const url = `ipfs://${added.path}`;
  //     this.fileurl = url;
  //   } catch (error) {
  //     console.log("Error uploading file: ", error);
  //   }
  };

  async saveNFT() {
    const metadata = {
      name: this.name,
      description: this.description,
      image: this.fileurl,
      geojson: this.geojson,
    };
    const metaRecv = await this.ipfsClient.add(JSON.stringify(metadata));
    console.log(metaRecv);

    // await dispatch(
    //   mint({ metadataURI: metaRecv.path, geojson: this.geojson })
    // ).unwrap();
    this.clearInputs();
  }
}


