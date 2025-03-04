import { createRoot, createSignal } from "solid-js"
import { screen, render, fireEvent } from "solid-testing-library"
import { Motion } from "../motion"

const duration = 0.001

describe("Motion", () => {
  test("Renders element as Div by default to HTML", async () => {
    await render(() => <Motion data-testid="box"></Motion>)
    const component = await screen.findByTestId("box")
    expect(component.tagName).toEqual(`DIV`)
  })
  test("Renders element as proxy Motion.Tag to HTML", async () => {
    await render(() => <Motion.span data-testid="box"></Motion.span>)
    const component = await screen.findByTestId("box")
    expect(component.tagName).toEqual(`SPAN`)
  })
  test("Renders element as 'tag' prop to HTML", async () => {
    await render(() => <Motion tag="li" data-testid="box"></Motion>)
    const component = await screen.findByTestId("box")
    expect(component.tagName).toEqual(`LI`)
  })
  test("renders children to HTML", async () => {
    await render(() => (
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        data-testid="box"
      >
        <Motion.a href="foo" />
        <Motion.svg viewBox="0 0 1 1" />
      </Motion.div>
    ))
    const component = await screen.findByTestId("box")
    expect(component.innerHTML).toEqual(
      `<a href="foo"></a><svg viewBox="0 0 1 1"></svg>`
    )
  })

  test("Applies initial as style to DOM node", async () => {
    await render(() => (
      <Motion.div data-testid="box" initial={{ opacity: 0.5, x: 100 }} />
    ))
    const component = await screen.findByTestId("box")
    expect(component.style.opacity).toBe("0.5")
    expect(component.style.getPropertyValue("--motion-translateX")).toBe(
      "100px"
    )
    expect(component.style.transform).toBe(
      "translateX(var(--motion-translateX))"
    )
  })

  test("Animation runs on mount if initial and animate differ", async () => {
    const element = await new Promise((resolve, reject) => {
      const Component = () => {
        let ref!: HTMLDivElement
        return (
          <Motion.div
            ref={ref}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0, 0.8] }}
            onMotionComplete={() => resolve(ref)}
            transition={{ duration }}
          />
        )
      }
      render(Component)
      setTimeout(() => reject(false), 200)
    })
    expect(element).toHaveStyle("opacity: 0.8")
  })

  test("Animation doesn't run on mount if initial and animate are the same", async () => {
    const element = await new Promise((resolve, reject) => {
      const Component = () => {
        const animate = { opacity: 0.4 }
        return (
          <Motion.div
            initial={animate}
            animate={animate}
            onMotionComplete={() => reject(false)}
            transition={{ duration }}
          />
        )
      }
      render(Component)
      setTimeout(() => resolve(true), 200)
    })
    expect(element).toBe(true)
  })

  test("Animation runs when target changes", async () => {
    const result = await new Promise((resolve) =>
      createRoot((dispose) => {
        const Component = (props: any) => {
          return (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={props.animate}
              onMotionComplete={({ detail }) => {
                if (detail.target.opacity === 0.8) resolve(true)
              }}
              transition={{ duration }}
            />
          )
        }
        const [animate, setAnimate] = createSignal({ opacity: 0.5 })
        render(() => <Component animate={animate()} />)
        setAnimate({ opacity: 0.8 })
        setTimeout(dispose, 20)
      })
    )
    expect(result).toBe(true)
  })

  test("Accepts default transition", async () => {
    const element = await new Promise<HTMLElement>((resolve) => {
      let ref!: HTMLDivElement
      render(() => (
        <Motion.div
          ref={ref}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 10 }}
        />
      ))
      setTimeout(() => resolve(ref), 500)
    })
    expect(element.style.opacity).not.toEqual("0.9")
  })

  test("animate default transition", async () => {
    const element = await new Promise<HTMLElement>((resolve) => {
      let ref!: HTMLDivElement
      render(() => (
        <Motion.div
          ref={ref}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0.9, transition: { duration: 10 } }}
        />
      ))
      setTimeout(() => resolve(ref), 500)
    })
    expect(element.style.opacity).not.toEqual("0.9")
  })

  test("Passes event handlers", async () => {
    const captured: any[] = []
    const element = await new Promise<HTMLElement>((resolve) => {
      let ref!: HTMLDivElement
      render(() => (
        <Motion.div
          ref={ref}
          hover={{ scale: 2 }}
          onHoverStart={() => captured.push(0)}
        />
      ))
      setTimeout(() => resolve(ref), 1)
    })
    fireEvent.pointerEnter(element)
    expect(captured).toEqual([0])
  })
})
