using UnityEngine;
using TMPro; // Assuming using TextMeshPro
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

public class ChallengeUIManager : MonoBehaviour
{
    [Header("UI References")]
    public GameObject challengePanel;
    public TextMeshProUGUI nameText;
    public TextMeshProUGUI scenarioText;
    public Transform buttonsContainer;
    public GameObject buttonPrefab; // A simple UI button with a TextMeshProUGUI child
    
    [Header("Success UI")]
    public GameObject successBanner;
    public TextMeshProUGUI successWordText;

    private void Start()
    {
        // Hide UI on start
        if (challengePanel) challengePanel.SetActive(false);
        if (successBanner) successBanner.SetActive(false);
    }

    public void OpenChallenge(string npcName, string scenario, string correctWord, string[] fakeWords)
    {
        challengePanel.SetActive(true);
        if (nameText) nameText.text = npcName;
        if (scenarioText) scenarioText.text = scenario;

        // Clear existing buttons
        foreach (Transform child in buttonsContainer)
            Destroy(child.gameObject);

        // Build list of all choices and shuffle them
        List<string> choices = new List<string>(fakeWords);
        choices.Add(correctWord);
        
        // Simple Shuffle
        for (int i = 0; i < choices.Count; i++)
        {
            string temp = choices[i];
            int r = Random.Range(i, choices.Count);
            choices[i] = choices[r];
            choices[r] = temp;
        }

        // Create buttons
        foreach (string word in choices)
        {
            var btnObj = Instantiate(buttonPrefab, buttonsContainer);
            var btn = btnObj.GetComponent<Button>();
            var txt = btnObj.GetComponentInChildren<TextMeshProUGUI>();
            if (txt) txt.text = word;

            // Bind click event
            btn.onClick.AddListener(() => OnWordSelected(word, correctWord, btn));
        }
    }

    private void OnWordSelected(string clickedWord, string correctWord, Button clickedButton)
    {
        if (clickedWord == correctWord)
        {
            // Win!
            clickedButton.GetComponent<Image>().color = Color.green;
            StartCoroutine(VictoryRoutine(correctWord));
        }
        else
        {
            // Wrong
            clickedButton.GetComponent<Image>().color = Color.red;
            // Optionally shake the button here
        }
    }

    private IEnumerator VictoryRoutine(string word)
    {
        // Tell GameManager we won
        if (GameManager.Instance) GameManager.Instance.UnlockWord(word);

        yield return new WaitForSeconds(0.5f);
        
        // Hide panel, show banner
        challengePanel.SetActive(false);
        if (successBanner && successWordText)
        {
            successWordText.text = "+ " + word.ToUpper();
            successBanner.SetActive(true);
            yield return new WaitForSeconds(2.0f);
            successBanner.SetActive(false);
        }

        // Unfreeze player
        var player = GameObject.FindGameObjectWithTag("Player")?.GetComponent<PlayerMovement>();
        if (player != null) player.enabled = true;
    }
}
