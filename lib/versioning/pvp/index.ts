import { regEx } from '../../util/regex';
import { GenericVersion, GenericVersioningApi } from '../loose/generic';
import { VersioningApi } from '../types';

export const id = 'pvp';
export const displayName = 'PVP';
export const urls = ['https://pvp.haskell.org'];
export const supportsRanges = false;

/**
 * At least 3 components and no leading 0s
 * https://pvp.haskell.org/#version-number
 */
const versionPattern = regEx(
  /^((([0-9])|([1-9][0-9]*))\.){2,}(([0-9])|([1-9][0-9]*))$/
);

class PvpVersioningApi extends GenericVersioningApi {
  /**
   * PVP has two major components A.B
   * To keep compatability with Renovate's versioning API we will treat it as a float
   */
  protected _parse(version: string): GenericVersion {
    const matches = versionPattern.exec(version);
    if (!matches) {
      return null;
    }

    const components = version.split('.');
    const major = parseFloat(`${components[0]}.${components[1]}`);
    const rest = components.slice(2).map((i) => parseInt(i));
    return { release: [major, ...rest] };
  }

  override getMajor(version: string): number | null {
    const { release } = this._parse(version);
    return parseFloat(`${release[0]}.${release[1]}`);
  }

  override getMinor(version: string): number | null {
    const { release } = this._parse(version);
    return release[2];
  }

  override getPatch(version: string): number | null {
    const { release } = this._parse(version);
    return release[3];
  }

  /**
   * Compare similar to GenericVersioningApi._compare implementation
   * except 2.1.1.0 and 2.1.1 are not equivilant instead 2.1.1.0 > 2.1.1
   */
  override _compare(version: string, other: string): number {
    const left = this._parse(version);
    const right = this._parse(other);

    // istanbul ignore if
    if (!(left && right)) {
      return 1;
    }

    // support variable length compare
    const length = Math.max(left.release.length, right.release.length);
    for (let i = 0; i < length; i += 1) {
      // 2.1.0 > 2.1
      const part1 = left.release[i] ?? -1;
      const part2 = right.release[i] ?? -1;
      if (part1 !== part2) {
        return part1 - part2;
      }
    }

    return 0;
  }
}

export const api: VersioningApi = new PvpVersioningApi();

export default api;
