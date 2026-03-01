using UnityEngine;

public class GuessUI : MonoBehaviour
{
    public static GuessUI Instance;

    public GameObject panel;
    public StoneManager stoneManager;

    EmotionNPC currentNPC;

    void Awake()
    {
        Instance = this;
    }

    public void Open(EmotionNPC npc)
    {
        panel.SetActive(true);
        currentNPC = npc;

        stoneManager.GenerateChoices(
            npc.emotion,
            OnChoiceSelected);
    }

    void OnChoiceSelected(EmotionData chosen)
    {
        if (chosen == currentNPC.emotion)
            currentNPC.CorrectAnswer();
        else
            currentNPC.WrongAnswer();

        panel.SetActive(false);
    }
}