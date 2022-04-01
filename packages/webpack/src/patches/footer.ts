import { ConcatSource } from 'webpack-sources';
import { Compilation, Compiler, ModuleFilenameHelpers, sources } from 'webpack';

interface CommentSource extends sources.Source {
  comment?: string;
}

export class FooterPlugin {
  constructor(
    private footer: string,
  ) {}

  apply(compiler: Compiler) {
    const banner = this.footer;
    const matchObject = ModuleFilenameHelpers.matchObject.bind(
      undefined,
      {
        test: /.js$/,
      },
    );

    const cache = new WeakMap<CommentSource, CommentSource>();

    compiler.hooks.compilation.tap('FooterPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'FooterPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          for (const chunk of compilation.chunks) {
            for (const file of chunk.files) {
              if (!matchObject(file)) {
                continue;
              }

              const data = {
                chunk,
                filename: file,
              };

              const comment = compilation.getPath(banner, data);

              // @ts-expect-error The constructor accepts instanceof ConcatSource
              compilation.updateAsset(file, (old) => {
                const cached = cache.get(old);
                if (cached?.comment !== comment) {
                  // @ts-expect-error The constructor accepts instanceof ConcatSource
                  const source = new ConcatSource(old, '\n', comment);
                  // @ts-expect-error source is mistyped
                  cache.set(old, { source, comment });
                  return source;
                }
                return cached.source;
              });
            }
          }
        },
      );
    });
  }
}
