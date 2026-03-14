import { Link, useRouter } from "expo-router"
import {
  FilePlusCorner,
  PackageOpen,
  SquareArrowRightEnter,
} from "lucide-react-native"
import { useEffect, useState, useTransition } from "react"
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native"
import { useLLM } from "react-native-executorch"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import BoardList from "./components/Board/BoardList"
import { Button, Text } from "./components/Styled"
import { usePagesetActions } from "./stores/boards"
import { handleError } from "./utils/error"
import { importBoardFile, loadBoard } from "./utils/file"
import {
  FONT_SIZE,
  FONT_WEIGHT,
  GAP,
  ICON_SIZE,
  MAX_WIDTH,
  PADDING,
  useTheme,
} from "./utils/theme"

export default function Index() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { addBoard } = usePagesetActions()
  const [loading, startLoading] = useTransition()
  const [llmMessage, setLlmMessage] = useState("")
  const [llmResponses, setLlmResponses] = useState<string[]>([])

  const llm = useLLM({
    model: {
      modelSource: "http://192.168.68.109:8081/temp/model.pte",
      tokenizerSource: "http://192.168.68.109:8081/temp/tokenizer.json",
      tokenizerConfigSource:
        "http://192.168.68.109:8081/temp/tokenizer_config.json",
    },
  })

  useEffect(() => {
    if (llm.response.indexOf("<e") > -1 || llm.response.indexOf("<bos>") > -1)
      llm.interrupt()
  }, [llm, llm.response])

  useEffect(() => {
    if (llm.isReady) console.log("LLM is ready")
  }, [llm.isReady])

  const openFile = async () => {
    try {
      const file = await importBoardFile()
      if (!file) return
      startLoading(async () => {
        const tree = await loadBoard(file.uri)
        addBoard({
          id: file.id,
          uri: file.uri,
          name: tree.metadata.name || "Untitled board",
        })
        router.push({ pathname: "/[board]", params: { board: file.id } })
      })
    } catch (e) {
      handleError(e)
    }
  }

  const testLLM = async (message: string) => {
    setLlmResponses([])
    if (!llm.isReady) return console.log(`Downloading: ${llm.downloadProgress}`)
    const responses = new Set()
    for (let i = 0; i < 5; i++) {
      try {
        let response = await llm.generate([{ role: "user", content: message }])
        response = response
          .replace(/<e.*$/, "")
          .replace(/\n*<\/*bos>.*$/, "")
          .replaceAll(/[^\w ']/g, "")
          .trim()
          .toLowerCase()
        if (!responses.has(response)) {
          responses.add(response)
          setLlmResponses((prev) => [...prev, response])
          console.log(response)
        }
      } catch (e) {
        handleError(e)
      }
    }
    console.log(responses)
  }

  return (
    <>
      <View
        style={{
          ...styles.container,
          backgroundColor: theme.background,
          paddingBottom: insets.bottom,
        }}
      >
        <View style={{ ...styles.boardList, backgroundColor: theme.surface }}>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Text
              style={{ fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semi }}
            >
              My boards
            </Text>
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Link href="/create" asChild>
                <Button variant="ghost">
                  <FilePlusCorner size={ICON_SIZE.md} color={theme.onSurface} />
                </Button>
              </Link>
              <Button variant="ghost" onPress={openFile}>
                <SquareArrowRightEnter
                  size={ICON_SIZE.md}
                  color={theme.onSurface}
                />
              </Button>
            </View>
          </View>
          <BoardList />
          {loading && (
            <ActivityIndicator size="large" color={theme.onSurface} />
          )}
          {!loading && (
            <>
              <Button
                variant="outline"
                onPress={() => router.push("/templates")}
              >
                <PackageOpen size={ICON_SIZE.md} color={theme.onSurface} />
                <Text style={{ color: theme.onSurface }}>View templates</Text>
              </Button>
            </>
          )}
          <TextInput
            value={llmMessage}
            onChangeText={setLlmMessage}
            style={{
              backgroundColor: theme.surfaceContainer,
              color: theme.onSurface,
            }}
          />
          <Button
            variant="primary"
            onPress={() => testLLM(llmMessage)}
            disabled={!llm.isReady}
          >
            <Text style={{ color: theme.onPrimary }}>
              {llm.isReady ? "Predict" : "Loading..."}
            </Text>
          </Button>
          <Button
            variant="ghost"
            onPress={() => {
              setLlmMessage("")
              setLlmResponses([])
            }}
          >
            <Text style={{ color: theme.onSurface }}>Clear</Text>
          </Button>
          {llmResponses.map((response, i) => (
            <Text key={i} style={{ color: theme.onSurface }}>
              {response}
            </Text>
          ))}
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  boardList: {
    width: MAX_WIDTH,
    maxWidth: "100%",
    padding: PADDING.xl,
    gap: GAP.xl,
  },
})
