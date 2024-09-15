
import { Context, Schema } from "koishi";
import type { CommonSourceRequest, ImageMetaData, LoliconRequest, SourceResponse, Config as PixlunaConfig } from "koishi-plugin-pixluna";
import { SourceProvider } from "koishi-plugin-pixluna";

declare module 'koishi' {
  interface Context {
    pixluna: SourceProviderService<any>
  }
}

export interface Config extends PixlunaConfig { }
export const Config = Schema.intersect([]);
export const inject = ["pixluna"];

export class LoliconSourceProvider extends SourceProvider<Config> {
  static RANDOM_IMAGE_URL = "https://api.lolicon.app/setu/v2";

  name = "Lolicon";

  async getMetaData({ context }: { context: Context }, props: CommonSourceRequest): Promise<SourceResponse<ImageMetaData>> {
    const res = await context.http
      .post<LoliconRequest>(LoliconSourceProvider.RANDOM_IMAGE_URL, props, {
        proxyAgent: this.config.isProxy ? this.config.proxyHost : undefined,
      })
      .then(async (res) => {
        return res.data?.[0];
      });

    if (!res || (!res?.urls?.regular && !res.urls.original)) {
      return {
        status: "error",
        data: null
      };
    }

    const url = this.config.compress ? res.urls.original : (res.urls.regular || res.urls.original);

    return {
      status: "success",
      data: {
        url: url,
        urls: {
          regular: res?.urls?.regular
        },
        raw: res,
      }
    };
  }
}

export function apply(ctx: Context, config: Config) {
  const provider = new LoliconSourceProvider(ctx, config).setName("Lolicon");
  ctx.pixluna.registerProvider(provider);
}
