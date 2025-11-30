declare module '../imagedata.json' {
  const data: {
    statusCode: number;
    message: string;
    data: Array<{
      source: string;
      id: string;
      width: number;
      height: number;
      imageUrl: {
        small: string;
        large: string;
        regular: string;
        downloadable: string;
      };
      alt_text: string;
      description: string;
      created_at: string;
    }>;
  };
  export default data;
}
