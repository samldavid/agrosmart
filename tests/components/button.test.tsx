import { render } from "@testing-library/react-native";

import { Button } from "@/components/primitives/Button";

describe("Button", () => {
  it("muestra el texto y expone rol accesible", async () => {
    const { getByRole, getByText } = await render(<Button title="Guardar" onPress={jest.fn()} />);

    expect(getByText("Guardar")).toBeTruthy();
    expect(getByRole("button")).toBeTruthy();
  });

  it("marca estado deshabilitado cuando carga", async () => {
    const { getByRole } = await render(<Button title="Guardando" loading onPress={jest.fn()} />);

    expect(getByRole("button").props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });
});
