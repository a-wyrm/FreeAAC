import { TrueSheet } from "@lodev09/react-native-true-sheet"
import { useLocalSearchParams } from "expo-router"
import { X } from "lucide-react-native"
import { forwardRef, useImperativeHandle, useState } from "react"
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native"
import { EditTile } from "../../app/[boardId]"
import { usePagesetActions } from "../../stores/boards"
import { handleError } from "../../utils/error"
import { selectImage } from "../../utils/file"
import {
  FONT_SIZE,
  GAP,
  ICON_SIZE,
  PADDING,
  RADIUS,
  useTheme,
} from "../../utils/theme"
import { BoardButton, TileImage } from "../../utils/types"
import { Text } from "../Styled"
import SymbolPicker, { SymbolSearchBar } from "../SymbolPicker"
import TileSettings from "./TileSettings"

type Tab = "settings" | "symbol"

const TabSelector = ({
  tab,
  setTab,
}: {
  tab: Tab
  setTab: (tab: Tab) => void
}) => {
  const theme = useTheme()
  return (
    <View
      style={{ flexDirection: "row", backgroundColor: theme.surfaceContainer }}
    >
      <Pressable
        style={{
          ...styles.tabButton,
          borderBottomColor: tab === "symbol" ? theme.onSurface : theme.outline,
          borderBottomWidth: tab === "symbol" ? 2 : 1,
        }}
        onPress={() => setTab("symbol")}
      >
        <Text
          style={{
            ...styles.tabButtonText,
            color: tab === "symbol" ? theme.onSurface : theme.outline,
          }}
        >
          Symbol
        </Text>
      </Pressable>
      <Pressable
        style={{
          ...styles.tabButton,
          borderBottomColor:
            tab === "settings" ? theme.onSurface : theme.outline,
          borderBottomWidth: tab === "settings" ? 2 : 1,
        }}
        onPress={() => setTab("settings")}
      >
        <Text
          style={{
            ...styles.tabButtonText,
            color: tab === "settings" ? theme.onSurface : theme.outline,
          }}
        >
          Settings
        </Text>
      </Pressable>
    </View>
  )
}

const EditorContent = ({
  button,
  image,
  tab,
  setTab,
  setButton,
  deleteTile,
}: {
  button: BoardButton | undefined
  image: TileImage | undefined
  tab: Tab
  setTab: (tab: Tab) => void
  setButton: (
    newButton: BoardButton | undefined,
    newImage: TileImage | undefined,
  ) => void
  onSelectImage: (takePhoto: boolean) => Promise<void>
  deleteTile: () => void
}) => {
  const theme = useTheme()
  const { setSymbolSearchText } = usePagesetActions()
  const { boardId } = useLocalSearchParams()
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          ...styles.labelContainer,
          padding: PADDING.xl,
          backgroundColor: theme.surfaceContainer,
        }}
      >
        <TextInput
          value={button?.label}
          onChangeText={(label) => {
            if (!button) return
            setButton(
              {
                ...button,
                label,
                message: label,
                semanticAction:
                  button.semanticAction ?
                    { ...button.semanticAction, text: label }
                  : undefined,
              },
              image,
            )
            setSymbolSearchText(label)
          }}
          style={{
            ...styles.input,
            ...styles.inputBorder,
            backgroundColor: theme.surface,
            color: theme.onSurface,
            borderColor: theme.outline,
          }}
        />
      </View>
      <TabSelector tab={tab} setTab={setTab} />
      {tab === "settings" && (
        <TileSettings
          boardId={boardId}
          button={button}
          setButton={(newButton) => setButton(newButton, image)}
          deleteTile={deleteTile}
        />
      )}
      {tab === "symbol" && (
        <SymbolPicker
          label={button?.label || ""}
          symbol={image}
          onSelect={(img) => setButton({ ...button! }, img)}
        />
      )}
    </View>
  )
}

const TileEditor = forwardRef(function TileEditor(
  {
    tile,
    setTile,
    onClose,
  }: {
    tile: EditTile | undefined
    setTile: (tile: EditTile) => void
    onClose: () => void
  },
  ref: React.ForwardedRef<
    TrueSheet | { present: () => void; dismiss: () => void } | null
  >,
) {
  const theme = useTheme()
  const { boardId } = useLocalSearchParams()
  const button = tile?.button
  const image = tile?.image
  const [tab, setTab] = useState<Tab>("symbol")
  const [isOpen, setIsOpen] = useState(false)
  const trueSheetRef = (ref as React.RefObject<TrueSheet>) || { current: null }

  const setButton = (
    newButton: BoardButton | undefined,
    newImage: TileImage | undefined,
  ) => {
    if (tile)
      setTile({
        button: newButton,
        image: newImage,
        index: tile.index,
      })
  }

  const deleteTile = () => {
    setButton(undefined, undefined)
    handleClose()
  }

  const onSelectImage = async (takePhoto: boolean) => {
    if (!button) return
    try {
      const image = await selectImage(takePhoto)
      if (image) setButton(button, image)
    } catch (e) {
      handleError(e)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  // Expose present/dismiss methods for web
  useImperativeHandle(ref, () => ({
    present: () => setIsOpen(true),
    dismiss: () => handleClose(),
  }))

  // Web version (modal)
  if (Platform.OS === "web") {
    return (
      <>
        {isOpen && (
          <View style={styles.webOverlay}>
            <Pressable style={styles.webBackdrop} onPress={handleClose} />
            <View style={[styles.webModal, { backgroundColor: theme.surface }]}>
              <View style={styles.webHeader}>
                <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: "600" }}>
                  Edit Tile
                </Text>
                <Pressable onPress={handleClose}>
                  <X size={ICON_SIZE.lg} color={theme.onSurface} />
                </Pressable>
              </View>
              {button && (
                <EditorContent
                  button={button}
                  image={image}
                  tab={tab}
                  setTab={setTab}
                  setButton={setButton}
                  onSelectImage={onSelectImage}
                  boardId={boardId}
                  deleteTile={deleteTile}
                />
              )}
            </View>
          </View>
        )}
      </>
    )
  }

  // Native version (TrueSheet)
  return (
    <TrueSheet
      ref={trueSheetRef as React.RefObject<TrueSheet>}
      detents={[0.5, 0.75, 1]}
      onWillDismiss={onClose}
      backgroundColor={theme.surface}
      scrollable
      footer={
        tab === "symbol" ?
          <SymbolSearchBar
            onSelectImage={() => onSelectImage(false)}
            onTakePhoto={() => onSelectImage(true)}
          />
        : undefined
      }
    >
      {button && (
        <EditorContent
          button={button}
          image={image}
          tab={tab}
          setTab={setTab}
          setButton={setButton}
          onSelectImage={onSelectImage}
          boardId={boardId}
          deleteTile={deleteTile}
        />
      )}
    </TrueSheet>
  )
})

const styles = StyleSheet.create({
  labelContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: GAP.lg,
  },
  input: {
    flex: 1,
    paddingVertical: PADDING.lg,
    paddingLeft: PADDING.lg,
    fontSize: FONT_SIZE.lg,
  },
  inputBorder: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
  },
  tabButtonText: {
    fontSize: FONT_SIZE.md,
    color: "grey",
  },
  webOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  webBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  webModal: {
    position: "relative",
    width: "90%",
    maxWidth: 600,
    maxHeight: 600,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    zIndex: 1001,
  },
  webHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: PADDING.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
})

export default TileEditor
