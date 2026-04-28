import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect } from "react"
import { usePagesetActions } from "../stores/boards"
import { handleError } from "../utils/error"
import { loadManifest } from "../utils/file"
import { BoardButton, TileImage } from "../utils/types"

export type EditTile = {
  button: BoardButton | undefined
  image: TileImage | undefined
  index: number
}

export default function Board() {
  const { boardId } = useLocalSearchParams()
  const { replace } = useRouter()
  const { setRootPage } = usePagesetActions()

  useEffect(() => {
    ;(async () => {
      try {
        const manifest = await loadManifest(boardId as string)
        if (!manifest.root) return handleError("Root not found in manifest")
        setRootPage(boardId as string, manifest.root)
        replace(`/${boardId}/${manifest.root}`)
      } catch (e) {
        handleError(e)
      }
    })()
  }, [boardId, replace, setRootPage])

  return <></>
}
